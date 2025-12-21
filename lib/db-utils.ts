import { getDb } from "./mongodb"
import type { User, Prayer, Todo, PasswordResetOTP } from "./models"
import { ObjectId } from "mongodb"

export const collections = {
  users: "users",
  prayers: "prayers",
  todos: "todos",
  habits: "habits",
  habitLogs: "habitLogs",
  passwordResetOTPs: "passwordResetOTPs",
}

export async function createIndexes() {
  const db = await getDb()

  await db.collection(collections.users).createIndex({ email: 1 }, { unique: true })
  await db.collection(collections.prayers).createIndex({ userId: 1, date: -1 })
  await db.collection(collections.todos).createIndex({ userId: 1, createdAt: -1 })
  await db.collection(collections.habits).createIndex({ userId: 1 })
  await db.collection(collections.habitLogs).createIndex({ userId: 1, habitId: 1, date: -1 })
  await db.collection(collections.passwordResetOTPs).createIndex({ email: 1, expiresAt: 1 })
  await db.collection(collections.passwordResetOTPs).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
}

export async function getUserByEmail(email: string) {
  const db = await getDb()
  return db.collection<User>(collections.users).findOne({ email })
}

export async function createUser(user: Omit<User, "_id">) {
  const db = await getDb()
  const result = await db.collection<User>(collections.users).insertOne(user as any)
  return result.insertedId
}

export async function getPrayersByDateRange(userId: string, startDate: string, endDate: string) {
  const db = await getDb()
  return db
    .collection<Prayer>(collections.prayers)
    .find({
      userId: userId as any,
      date: { $gte: startDate, $lte: endDate },
    })
    .sort({ date: -1 })
    .toArray()
}

export async function upsertPrayer(prayer: Omit<Prayer, "_id">) {
  const db = await getDb()
  return db
    .collection<Prayer>(collections.prayers)
    .updateOne({ userId: prayer.userId, date: prayer.date }, { $set: prayer }, { upsert: true })
}

export async function getTodosByUser(userId: string) {
  const db = await getDb()
  return db
    .collection<Todo>(collections.todos)
    .find({ userId: userId as any })
    .sort({ createdAt: -1 })
    .toArray()
}

export async function createTodo(todo: Omit<Todo, "_id">) {
  const db = await getDb()
  const result = await db.collection<Todo>(collections.todos).insertOne(todo as any)
  return result.insertedId
}

export async function updateTodo(todoId: string, update: Partial<Todo>) {
  const db = await getDb()
  return db.collection<Todo>(collections.todos).updateOne({ _id: todoId as any }, { $set: update })
}

export async function deleteTodo(todoId: string) {
  const db = await getDb()
  return db.collection<Todo>(collections.todos).deleteOne({ _id: todoId as any })
}

// Password Reset OTP functions
export async function createPasswordResetOTP(email: string, otp: string) {
  const db = await getDb()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Invalidate any existing OTPs for this email
  await db.collection<PasswordResetOTP>(collections.passwordResetOTPs).updateMany(
    { email, used: false },
    { $set: { used: true } },
  )

  // Create new OTP
  const result = await db.collection<PasswordResetOTP>(collections.passwordResetOTPs).insertOne({
    email,
    otp,
    expiresAt,
    createdAt: new Date(),
    used: false,
  })

  return result.insertedId
}

export async function verifyPasswordResetOTP(email: string, otp: string): Promise<boolean> {
  const db = await getDb()
  const otpRecord = await db.collection<PasswordResetOTP>(collections.passwordResetOTPs).findOne({
    email,
    otp,
    used: false,
    expiresAt: { $gt: new Date() },
  })

  if (!otpRecord) return false

  // Mark OTP as used
  await db.collection<PasswordResetOTP>(collections.passwordResetOTPs).updateOne(
    { _id: otpRecord._id },
    { $set: { used: true } },
  )

  return true
}

export async function updateUserPassword(email: string, newPassword: string) {
  const db = await getDb()
  const { hashPassword } = await import("./auth")
  const hashedPassword = await hashPassword(newPassword)

  await db.collection<User>(collections.users).updateOne({ email }, { $set: { password: hashedPassword } })
}

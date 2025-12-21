"use server"

import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { collections } from "@/lib/db-utils"
import { ObjectId } from "mongodb"
import type { Todo } from "@/lib/models"
import { revalidatePath } from "next/cache"

export async function getTodos() {
  const user = await getCurrentUser()
  if (!user) return []

  const db = await getDb()
  const todos = await db
    .collection<Todo>(collections.todos)
    .find({ userId: new ObjectId(user._id) })
    .sort({ createdAt: -1 })
    .toArray()

  return todos.map((todo) => ({
    ...todo,
    _id: todo._id!.toString(),
    userId: todo.userId.toString(),
  }))
}

export async function createTodo(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const points = Number.parseInt(formData.get("points") as string) || 5

  if (!title) {
    return { error: "Title is required" }
  }

  const db = await getDb()
  await db.collection<Todo>(collections.todos).insertOne({
    userId: new ObjectId(user._id),
    title,
    description: description || undefined,
    completed: false,
    points,
    createdAt: new Date(),
  })

  revalidatePath("/dashboard")
  return { success: true }
}

export async function toggleTodo(todoId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const db = await getDb()
  const todo = await db.collection<Todo>(collections.todos).findOne({
    _id: new ObjectId(todoId),
    userId: new ObjectId(user._id),
  })

  if (!todo) throw new Error("Todo not found")

  const newCompleted = !todo.completed
  await db.collection<Todo>(collections.todos).updateOne(
    { _id: new ObjectId(todoId) },
    {
      $set: {
        completed: newCompleted,
        completedAt: newCompleted ? new Date() : undefined,
      },
    },
  )

  // Update user points
  const pointsDelta = newCompleted ? todo.points : -todo.points
  await db
    .collection(collections.users)
    .updateOne({ _id: new ObjectId(user._id) }, { $inc: { totalPoints: pointsDelta } })

  revalidatePath("/dashboard")
}

export async function deleteTodo(todoId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const db = await getDb()
  const todo = await db.collection<Todo>(collections.todos).findOne({
    _id: new ObjectId(todoId),
    userId: new ObjectId(user._id),
  })

  if (!todo) throw new Error("Todo not found")

  // If todo was completed, remove points
  if (todo.completed) {
    await db
      .collection(collections.users)
      .updateOne({ _id: new ObjectId(user._id) }, { $inc: { totalPoints: -todo.points } })
  }

  await db.collection<Todo>(collections.todos).deleteOne({ _id: new ObjectId(todoId) })

  revalidatePath("/dashboard")
}

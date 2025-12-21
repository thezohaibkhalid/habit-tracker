"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2 } from "lucide-react"
import { createTodo, toggleTodo, deleteTodo } from "@/app/actions/todos"
import { useRouter } from "next/navigation"
import type { Todo } from "@/lib/models"

interface TodoListProps {
  initialTodos: Array<
    Omit<Todo, "_id" | "userId"> & {
      _id: string
      userId: string
    }
  >
}

export function TodoList({ initialTodos }: TodoListProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  const handleToggle = async (todoId: string) => {
    setLoading(todoId)
    try {
      const result = await toggleTodo(todoId)
      if (result?.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to toggle todo:", error)
      alert("Failed to toggle todo")
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (todoId: string) => {
    const todo = initialTodos.find((t) => t._id === todoId)
    if (todo?.completed) {
      alert("Cannot delete a completed task")
      return
    }

    setLoading(todoId)
    try {
      const result = await deleteTodo(todoId)
      if (result?.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to delete todo:", error)
      alert("Failed to delete todo")
    } finally {
      setLoading(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      await createTodo(formData)
      setOpen(false)
      router.refresh()
      ;(e.target as HTMLFormElement).reset()
    } catch (error) {
      console.error("Failed to create todo:", error)
    }
  }

  const activeTodos = initialTodos.filter((t) => !t.completed)
  const completedTodos = initialTodos.filter((t) => t.completed)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Todo List</CardTitle>
            <CardDescription>
              {activeTodos.length} active, {completedTodos.length} completed
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new task to your todo list and earn points when you complete it.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" placeholder="What needs to be done?" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea id="description" name="description" placeholder="Add more details..." rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="points">Points</Label>
                  <Input id="points" name="points" type="number" defaultValue={5} min={1} max={100} />
                </div>
                <Button type="submit" className="w-full">
                  Create Task
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeTodos.length === 0 && completedTodos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No tasks yet</p>
            <p className="text-sm">Create your first task to get started</p>
          </div>
        ) : (
          <>
            {/* Active Todos */}
            {activeTodos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Active Tasks</h3>
                {activeTodos.map((todo) => (
                  <div
                    key={todo._id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleToggle(todo._id)}
                      disabled={loading === todo._id}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{todo.title}</p>
                        <Badge variant="secondary" className="text-xs">
                          +{todo.points} pts
                        </Badge>
                      </div>
                      {todo.description && <p className="text-sm text-muted-foreground mt-1">{todo.description}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(todo._id)}
                      disabled={loading === todo._id}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Completed Todos */}
            {completedTodos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Completed</h3>
                {completedTodos.map((todo) => (
                  <div
                    key={todo._id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={todo.completed}
                      disabled={true}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium line-through text-muted-foreground">{todo.title}</p>
                        <Badge variant="outline" className="text-xs">
                          +{todo.points} pts
                        </Badge>
                      </div>
                      {todo.description && (
                        <p className="text-sm text-muted-foreground line-through mt-1">{todo.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// app/tasks/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Task {
  _id: string;
  name: string;
  status: "complete" | "in progress";
  assignedTeamMember: any;
  project: any;
}

interface Todo {
  _id: string;
  name: string;
  status: "complete" | "in progress";
  task: string;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodoName, setNewTodoName] = useState("");

  useEffect(() => {
    if (params.id) {
      fetchTask();
      fetchTodos();
    }
  }, [params.id]);

  const fetchTask = async () => {
    try {
      const response = await fetch("/api/tasks");
      const result = await response.json();

      if (result.success) {
        const foundTask = result.data.find((t: Task) => t._id === params.id);
        setTask(foundTask);
      }
    } catch (error) {
      console.error("Error fetching task:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodos = async () => {
    try {
      const response = await fetch("/api/todos");
      const result = await response.json();

      if (result.success) {
        const taskTodos = result.data.filter(
          (todo: Todo) => todo.task === params.id
        );
        setTodos(taskTodos);
      }
    } catch (error) {
      console.error("Error fetching todos:", error);
    }
  };

  const deleteTask = async () => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks?id=${params.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        router.push("/tasks");
      } else {
        alert("Error deleting task: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Error deleting task");
    }
  };

  const updateTaskStatus = async (newStatus: "complete" | "in progress") => {
    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: params.id,
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTask({ ...task!, status: newStatus });

        // If marking task as complete, complete all todos
        if (newStatus === "complete") {
          await Promise.all(
            todos.map((todo) =>
              fetch("/api/todos", {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  _id: todo._id,
                  status: "complete",
                }),
              })
            )
          );
          fetchTodos(); // Refresh todos
        }
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoName.trim()) return;

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTodoName,
          task: params.id,
          status: "in progress",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setNewTodoName("");
        fetchTodos();
      } else {
        alert("Error adding todo: " + result.error);
      }
    } catch (error) {
      console.error("Error adding todo:", error);
      alert("Error adding todo");
    }
  };

  const updateTodoStatus = async (
    todoId: string,
    newStatus: "complete" | "in progress"
  ) => {
    try {
      const response = await fetch("/api/todos", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: todoId,
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        fetchTodos();
        fetchTask(); // Refresh task to update progress
      }
    } catch (error) {
      console.error("Error updating todo status:", error);
    }
  };

  const deleteTodo = async (todoId: string) => {
    try {
      const response = await fetch(`/api/todos?id=${todoId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        fetchTodos();
      } else {
        alert("Error deleting todo: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
      alert("Error deleting todo");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading task...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">Task not found</div>
        <Link href="/tasks" className="btn btn-primary">
          Back to Tasks
        </Link>
      </div>
    );
  }

  const completedTodos = todos.filter(
    (todo) => todo.status === "complete"
  ).length;
  const totalTodos = todos.length;
  const todoProgress =
    totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{task.name}</h1>
          <p className="text-gray-600 mt-2">Project: {task.project?.name}</p>
        </div>
        <div className="flex space-x-4">
          <Link href={`/tasks/${task._id}/edit`} className="btn btn-secondary">
            Edit Task
          </Link>
          <button onClick={deleteTask} className="btn btn-danger">
            Delete Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Task Status */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Task Status</h2>
            <div className="flex items-center space-x-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  task.status === "complete"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                {task.status}
              </span>
              <button
                onClick={() =>
                  updateTaskStatus(
                    task.status === "complete" ? "in progress" : "complete"
                  )
                }
                className={`btn ${
                  task.status === "complete" ? "btn-secondary" : "btn-primary"
                }`}>
                Mark as{" "}
                {task.status === "complete" ? "In Progress" : "Complete"}
              </button>
            </div>
          </div>

          {/* Todo List */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Todo List</h2>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Todos Progress</span>
                <span>
                  {todoProgress}% ({completedTodos}/{totalTodos})
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${todoProgress}%` }}></div>
              </div>
            </div>

            {/* Add Todo Form */}
            <form onSubmit={addTodo} className="mb-6">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newTodoName}
                  onChange={(e) => setNewTodoName(e.target.value)}
                  placeholder="Add a new todo item..."
                  className="input flex-1"
                />
                <button type="submit" className="btn btn-primary">
                  Add
                </button>
              </div>
            </form>

            {/* Todo Items */}
            <div className="space-y-3">
              {todos.map((todo) => (
                <div
                  key={todo._id}
                  className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={todo.status === "complete"}
                      onChange={(e) => {
                        const newStatus = e.target.checked
                          ? "complete"
                          : "in progress";
                        updateTodoStatus(todo._id, newStatus);
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span
                      className={
                        todo.status === "complete"
                          ? "line-through text-gray-500"
                          : "text-gray-900"
                      }>
                      {todo.name}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTodo(todo._id)}
                    className="text-red-600 hover:text-red-800 text-sm">
                    Delete
                  </button>
                </div>
              ))}
              {todos.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No todos yet. Add your first todo item above.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Task Details */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Task Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`font-medium ${
                    task.status === "complete"
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}>
                  {task.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Project:</span>
                <span className="font-medium">{task.project?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Assigned To:</span>
                <span className="font-medium">
                  {task.assignedTeamMember?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="font-medium">
                  {task.assignedTeamMember?.role}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">
                  {task.assignedTeamMember?.email}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() =>
                  updateTaskStatus(
                    task.status === "complete" ? "in progress" : "complete"
                  )
                }
                className={`block w-full btn text-center ${
                  task.status === "complete" ? "btn-secondary" : "btn-primary"
                }`}>
                Mark as{" "}
                {task.status === "complete" ? "In Progress" : "Complete"}
              </button>
              <Link
                href={`/tasks/${task._id}/edit`}
                className="block w-full btn btn-secondary text-center">
                Edit Task
              </Link>
              <Link
                href={`/projects/${task.project?._id}`}
                className="block w-full btn btn-secondary text-center">
                View Project
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

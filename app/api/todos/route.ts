// app/api/todos/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Todo from "@/lib/models/Todo";
import Task from "@/lib/models/Task";
import Project from "@/lib/models/Project";
import { Types } from "mongoose";
import { ITodo } from "@/types/todo";
import { ITask } from "@/types/task";
import { updateProjectProgress } from "@/lib/progressCalculator";

// GET all todos
export async function GET() {
  try {
    await connectDB();

    const todos = await Todo.find().populate("task").sort({ created_at: -1 });

    return NextResponse.json({ success: true, data: todos });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST create new todo - FIXED
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const todo = (await Todo.create(body)) as any as ITodo;

    const populatedTodo = await Todo.findById(todo._id).populate("task");

    return NextResponse.json(
      { success: true, data: populatedTodo },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// PUT update todo - FIXED
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json(
        { success: false, error: "Todo ID is required" },
        { status: 400 }
      );
    }

    const todo = await Todo.findByIdAndUpdate(_id, updateData, {
      new: true,
      runValidators: true,
    }).populate("task");

    if (!todo) {
      return NextResponse.json(
        { success: false, error: "Todo not found" },
        { status: 404 }
      );
    }

    // If todo is marked complete, check if all todos in task are complete
    if (updateData.status === "complete") {
      await checkAndUpdateTaskProgress((todo as any).task);
    }

    return NextResponse.json({ success: true, data: todo });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// DELETE todo
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Todo ID is required" },
        { status: 400 }
      );
    }

    const todo = await Todo.findByIdAndDelete(id);

    if (!todo) {
      return NextResponse.json(
        { success: false, error: "Todo not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to update task and project progress
async function checkAndUpdateTaskProgress(taskId: string) {
  // Check if all todos in this task are complete
  const incompleteTodos = await Todo.countDocuments({
    task: taskId,
    status: "in progress",
  });

  const task = (await Task.findById(taskId)) as any as ITask;
  if (!task) return;

  // Update task status
  if (incompleteTodos === 0) {
    await Task.findByIdAndUpdate(taskId, { status: "complete" });
  } else {
    await Task.findByIdAndUpdate(taskId, { status: "in progress" });
  }

  // Update project progress using the shared utility
  await updateProjectProgress(task.project.toString());
}

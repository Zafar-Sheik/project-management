// app/api/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Task from "@/lib/models/Task";
import Todo from "@/lib/models/Todo";
import Project from "@/lib/models/Project";
import { Types } from "mongoose";
import { ITask } from "@/types/task";
import { IProject } from "@/types/project";
import { updateProjectProgress } from "@/lib/progressCalculator";

// GET all tasks
export async function GET() {
  try {
    await connectDB();

    const tasks = await Task.find()
      .populate("assignedTeamMember")
      .populate("project")
      .sort({ created_at: -1 });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST create new task
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const task = (await Task.create(body)) as any as ITask;

    // Add task to project's tasks array
    await Project.findByIdAndUpdate(body.project, {
      $push: { tasks: task._id },
    });

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTeamMember")
      .populate("project");

    return NextResponse.json(
      { success: true, data: populatedTask },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// app/api/tasks/route.ts - Update the PUT function
// PUT update task
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      );
    }

    const task = await Task.findByIdAndUpdate(_id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("assignedTeamMember")
      .populate("project");

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // If task is marked complete, complete all its todos
    if (updateData.status === "complete") {
      await Todo.updateMany({ task: _id }, { status: "complete" });
    }

    // Update project progress whenever task status changes
    await updateProjectProgress((task as any).project);

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// DELETE task - FIXED with proper typing
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Get task first to know which project it belongs to - with proper typing
    const task = (await Task.findById(id)) as any as ITask;
    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // Remove task from project's tasks array - now TypeScript knows the structure
    await Project.findByIdAndUpdate(task.project, {
      $pull: { tasks: new Types.ObjectId(id) },
    });

    // Delete all todos associated with this task
    await Todo.deleteMany({ task: id });

    // Delete the task
    await Task.findByIdAndDelete(id);

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

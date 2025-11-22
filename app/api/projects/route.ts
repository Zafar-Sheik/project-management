// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Project from "@/lib/models/Project";
import Task from "@/lib/models/Task";
import {
  updateProjectProgress,
  calculateProjectProgress,
} from "@/lib/progressCalculator";

// GET all projects
export async function GET() {
  try {
    await connectDB();

    const projects = await Project.find()
      .populate("client")
      .populate({
        path: "tasks",
        populate: {
          path: "assignedTeamMember",
          model: "TeamMember",
        },
      })
      .sort({ created_at: -1 });

    return NextResponse.json({ success: true, data: projects });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST create new project
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const project = await Project.create(body);

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// PATCH endpoint to recalculate progress for a specific project
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Project ID is required" },
        { status: 400 }
      );
    }

    if (action === "recalculate-progress") {
      await updateProjectProgress(id);
      const project = await Project.findById(id)
        .populate("client")
        .populate("tasks");

      return NextResponse.json({
        success: true,
        data: project,
        message: "Progress recalculated successfully",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE project
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Delete all tasks associated with this project
    await Task.deleteMany({ project: id });

    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
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

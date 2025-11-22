// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Project from "@/lib/models/Project";
import Task from "@/lib/models/Task";
import {
  updateProjectProgress,
  calculateProjectProgress,
} from "@/lib/progressCalculator";
import { Types } from "mongoose";

// TypeScript interfaces
interface IProject {
  _id: Types.ObjectId;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  client: Types.ObjectId;
  tasks: Types.ObjectId[];
  created_at: Date;
  updated_at: Date;
}

interface IProjectDocument extends IProject {
  save(): Promise<IProjectDocument>;
}

interface IProjectCreateData {
  name: string;
  startDate: string;
  endDate: string;
  client: string;
  progress?: number;
}

interface IProjectUpdateData {
  _id: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  client?: string;
  progress?: number;
}

// Error response helper
function errorResponse(message: string, status: number = 500, details?: any) {
  console.error(`Projects API Error (${status}):`, message, details);

  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(process.env.NODE_ENV === "development" && { details }),
    },
    { status }
  );
}

// Success response helper
function successResponse(data: any, status: number = 200, message?: string) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

// Safe property access helper
function getProjectName(project: any): string {
  return project?.name || project?.name || "Unknown Project";
}

function getProjectId(project: any): string {
  return project?._id?.toString() || project?.id || "Unknown ID";
}

// Validation helper
function validateProjectData(body: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (
    !body.name ||
    typeof body.name !== "string" ||
    body.name.trim().length === 0
  ) {
    errors.push("Project name is required and must be a string");
  }

  if (!body.startDate || typeof body.startDate !== "string") {
    errors.push("Start date is required and must be a string");
  }

  if (!body.endDate || typeof body.endDate !== "string") {
    errors.push("End date is required and must be a string");
  }

  if (body.startDate && body.endDate) {
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      errors.push("Invalid date format");
    } else if (endDate <= startDate) {
      errors.push("End date must be after start date");
    }
  }

  if (!body.client || typeof body.client !== "string") {
    errors.push("Client ID is required and must be a string");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// GET all projects
export async function GET() {
  try {
    console.log("🔄 Fetching projects...");

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
      .sort({ created_at: -1 })
      .maxTimeMS(30000); // 30 second timeout

    console.log(`✅ Successfully fetched ${projects.length} projects`);

    return successResponse(projects);
  } catch (error: any) {
    console.error("❌ GET Projects Error:", error);

    if (
      error.name === "MongoNetworkError" ||
      error.name === "MongoTimeoutError"
    ) {
      return errorResponse(
        "Database connection failed. Please try again.",
        503
      );
    }

    if (error.name === "ValidationError") {
      return errorResponse("Data validation failed", 400, error.errors);
    }

    return errorResponse(
      "Failed to fetch projects",
      500,
      process.env.NODE_ENV === "development" ? error.message : undefined
    );
  }
}

// POST create new project
export async function POST(request: NextRequest) {
  let body: IProjectCreateData;

  try {
    body = await request.json();
  } catch (parseError) {
    return errorResponse("Invalid JSON in request body", 400);
  }

  try {
    // Validate request data
    const validation = validateProjectData(body);
    if (!validation.isValid) {
      return errorResponse("Validation failed", 400, validation.errors);
    }

    console.log("🔄 Creating new project...", { name: body.name });

    await connectDB();

    const project = await Project.create({
      name: body.name,
      startDate: body.startDate,
      endDate: body.endDate,
      client: body.client,
      progress: 0, // Initialize progress to 0
    });

    // Use the safe property access helpers
    const projectName = getProjectName(project);
    const projectId = getProjectId(project);

    console.log(
      `✅ Successfully created project: ${projectName} (${projectId})`
    );

    // Populate the project before returning
    const populatedProject = await Project.findById(projectId)
      .populate("client")
      .populate("tasks");

    return successResponse(
      populatedProject,
      201,
      "Project created successfully"
    );
  } catch (error: any) {
    console.error("❌ POST Project Error:", error);

    if (error.name === "MongoServerError" && error.code === 11000) {
      return errorResponse("Project with this name already exists", 409);
    }

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return errorResponse("Project validation failed", 400, validationErrors);
    }

    if (error.name === "CastError") {
      return errorResponse("Invalid data format", 400);
    }

    return errorResponse(
      "Failed to create project",
      400,
      process.env.NODE_ENV === "development" ? error.message : undefined
    );
  }
}

// PUT update project
export async function PUT(request: NextRequest) {
  let body: IProjectUpdateData;

  try {
    body = await request.json();
  } catch (parseError) {
    return errorResponse("Invalid JSON in request body", 400);
  }

  try {
    const { _id, ...updateData } = body;

    if (!_id) {
      return errorResponse("Project ID is required", 400);
    }

    // Validate update data if provided
    if (
      updateData.name ||
      updateData.startDate ||
      updateData.endDate ||
      updateData.client
    ) {
      const validationData = {
        name: updateData.name || "dummy",
        startDate: updateData.startDate || "2000-01-01",
        endDate: updateData.endDate || "2000-01-02",
        client: updateData.client || "dummy",
      };

      const validation = validateProjectData(validationData);
      if (!validation.isValid) {
        // Filter out dummy value errors
        const realErrors = validation.errors.filter(
          (error) =>
            !error.includes("dummy") &&
            !error.includes("Invalid date format for dummy dates")
        );

        if (realErrors.length > 0) {
          return errorResponse("Validation failed", 400, realErrors);
        }
      }
    }

    console.log(`🔄 Updating project: ${_id}`, updateData);

    await connectDB();

    const project = await Project.findByIdAndUpdate(_id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("client")
      .populate("tasks");

    if (!project) {
      return errorResponse("Project not found", 404);
    }

    const projectName = getProjectName(project);
    console.log(`✅ Successfully updated project: ${projectName}`);

    return successResponse(project, 200, "Project updated successfully");
  } catch (error: any) {
    console.error("❌ PUT Project Error:", error);

    if (error.name === "CastError") {
      return errorResponse("Invalid project ID format", 400);
    }

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return errorResponse("Project validation failed", 400, validationErrors);
    }

    return errorResponse(
      "Failed to update project",
      400,
      process.env.NODE_ENV === "development" ? error.message : undefined
    );
  }
}

// PATCH endpoint to recalculate progress for a specific project
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action");

    if (!id) {
      return errorResponse("Project ID is required", 400);
    }

    if (action !== "recalculate-progress") {
      return errorResponse(
        "Invalid action. Supported action: recalculate-progress",
        400
      );
    }

    console.log(`🔄 Recalculating progress for project: ${id}`);

    await connectDB();

    // Verify project exists
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return errorResponse("Project not found", 404);
    }

    const existingProjectName = getProjectName(existingProject);

    await updateProjectProgress(id);

    const project = await Project.findById(id)
      .populate("client")
      .populate("tasks");

    if (!project) {
      return errorResponse("Project not found after progress update", 404);
    }

    const projectName = getProjectName(project);
    const projectProgress = (project as any).progress || 0;

    console.log(
      `✅ Successfully recalculated progress for project: ${projectName} - ${projectProgress}%`
    );

    return successResponse(project, 200, "Progress recalculated successfully");
  } catch (error: any) {
    console.error("❌ PATCH Project Error:", error);

    if (error.name === "CastError") {
      return errorResponse("Invalid project ID format", 400);
    }

    return errorResponse(
      "Failed to recalculate project progress",
      500,
      process.env.NODE_ENV === "development" ? error.message : undefined
    );
  }
}

// DELETE project
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return errorResponse("Project ID is required", 400);
    }

    console.log(`🔄 Deleting project: ${id}`);

    await connectDB();

    // Verify project exists first
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return errorResponse("Project not found", 404);
    }

    const projectName = getProjectName(existingProject);

    // Delete all tasks associated with this project
    const deleteTasksResult = await Task.deleteMany({ project: id });
    console.log(
      `🗑️ Deleted ${deleteTasksResult.deletedCount} tasks for project ${id}`
    );

    // Delete the project
    await Project.findByIdAndDelete(id);

    console.log(`✅ Successfully deleted project: ${projectName}`);

    return successResponse(
      {
        deletedProjectId: id,
        deletedProjectName: projectName,
        deletedTasksCount: deleteTasksResult.deletedCount,
      },
      200,
      "Project and associated tasks deleted successfully"
    );
  } catch (error: any) {
    console.error("❌ DELETE Project Error:", error);

    if (error.name === "CastError") {
      return errorResponse("Invalid project ID format", 400);
    }

    return errorResponse(
      "Failed to delete project",
      500,
      process.env.NODE_ENV === "development" ? error.message : undefined
    );
  }
}

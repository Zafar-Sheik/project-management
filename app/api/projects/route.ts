// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Project from "@/lib/models/Project";
import Task from "@/lib/models/Task";
import {
  updateProjectProgress,
  calculateProjectProgress,
} from "@/lib/progressCalculator";

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

// Validation helper
function validateProjectData(body: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!body.name || body.name.trim().length === 0) {
    errors.push("Project name is required");
  }

  if (!body.startDate) {
    errors.push("Start date is required");
  }

  if (!body.endDate) {
    errors.push("End date is required");
  }

  if (body.startDate && body.endDate) {
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (endDate <= startDate) {
      errors.push("End date must be after start date");
    }
  }

  if (!body.client) {
    errors.push("Client is required");
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
  let body;

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
      ...body,
      progress: 0, // Initialize progress to 0
    });

    console.log(
      `✅ Successfully created project: ${project.name} (${project._id})`
    );

    return successResponse(project, 201, "Project created successfully");
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
  let body;

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
      const validation = validateProjectData({
        name: updateData.name || "dummy",
        ...updateData,
      });
      if (!validation.isValid) {
        return errorResponse("Validation failed", 400, validation.errors);
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

    console.log(`✅ Successfully updated project: ${project.name}`);

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

    await updateProjectProgress(id);

    const project = await Project.findById(id)
      .populate("client")
      .populate("tasks");

    console.log(
      `✅ Successfully recalculated progress for project: ${project.name} - ${project.progress}%`
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

    // Use transaction-like pattern for atomic operations
    const session = await Project.startSession();

    try {
      session.startTransaction();

      // Delete all tasks associated with this project
      const deleteTasksResult = await Task.deleteMany(
        { project: id },
        { session }
      );
      console.log(
        `🗑️ Deleted ${deleteTasksResult.deletedCount} tasks for project ${id}`
      );

      // Delete the project
      const project = await Project.findByIdAndDelete(id, { session });

      await session.commitTransaction();

      console.log(`✅ Successfully deleted project: ${existingProject.name}`);

      return successResponse(
        {
          deletedProject: project,
          deletedTasksCount: deleteTasksResult.deletedCount,
        },
        200,
        "Project and associated tasks deleted successfully"
      );
    } catch (transactionError) {
      await session.abortTransaction();
      throw transactionError;
    } finally {
      session.endSession();
    }
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

// app/api/team-members/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import TeamMember from "@/lib/models/TeamMember";
import Task from "@/lib/models/Task";

// GET all team members
export async function GET() {
  try {
    await connectDB();

    const teamMembers = await TeamMember.find().sort({ created_at: -1 });

    return NextResponse.json({ success: true, data: teamMembers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST create new team member
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const teamMember = await TeamMember.create(body);

    return NextResponse.json(
      { success: true, data: teamMember },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// PUT update team member
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json(
        { success: false, error: "Team member ID is required" },
        { status: 400 }
      );
    }

    const teamMember = await TeamMember.findByIdAndUpdate(_id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!teamMember) {
      return NextResponse.json(
        { success: false, error: "Team member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: teamMember });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// DELETE team member
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Team member ID is required" },
        { status: 400 }
      );
    }

    // Check if team member is assigned to any tasks
    const assignedTasks = await Task.countDocuments({ assignedTeamMember: id });
    if (assignedTasks > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete team member assigned to tasks. Reassign tasks first.",
        },
        { status: 400 }
      );
    }

    const teamMember = await TeamMember.findByIdAndDelete(id);

    if (!teamMember) {
      return NextResponse.json(
        { success: false, error: "Team member not found" },
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

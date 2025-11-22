// app/api/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Client from "@/lib/models/Client";
import Project from "@/lib/models/Project";

// GET all clients
export async function GET() {
  try {
    await connectDB();

    const clients = await Client.find().sort({ created_at: -1 });

    return NextResponse.json({ success: true, data: clients });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST create new client
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const client = await Client.create(body);

    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// PUT update client
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json(
        { success: false, error: "Client ID is required" },
        { status: 400 }
      );
    }

    const client = await Client.findByIdAndUpdate(_id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: client });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// DELETE client
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Client ID is required" },
        { status: 400 }
      );
    }

    // Check if client has any projects
    const clientProjects = await Project.countDocuments({ client: id });
    if (clientProjects > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete client with associated projects. Delete projects first.",
        },
        { status: 400 }
      );
    }

    const client = await Client.findByIdAndDelete(id);

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
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

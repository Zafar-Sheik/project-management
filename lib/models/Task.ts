// models/Task.ts (Improved)
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITask extends Document {
  name: string;
  status: "complete" | "in progress";
  assignedTeamMember: Types.ObjectId;
  project: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    name: {
      type: String,
      required: [true, "Task name is required"],
      trim: true,
      maxlength: [200, "Task name cannot exceed 200 characters"],
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: {
        values: ["complete", "in progress"],
        message: "Status must be either 'complete' or 'in progress'",
      },
      default: "in progress",
    },
    assignedTeamMember: {
      type: Schema.Types.ObjectId,
      ref: "TeamMember",
      required: [true, "Assigned team member is required"],
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project is required"],
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Index for better query performance
TaskSchema.index({ status: 1 });
TaskSchema.index({ assignedTeamMember: 1 });
TaskSchema.index({ project: 1 });

export default mongoose.models.Task ||
  mongoose.model<ITask>("Task", TaskSchema);

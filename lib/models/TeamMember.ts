// models/TeamMember.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITeamMember extends Document {
  name: string;
  role: "Project Manager" | "Backend Developer" | "Frontend Developer";
  email: string;
  created_at: Date;
  updated_at: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    name: {
      type: String,
      required: [true, "Team member name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: {
        values: ["Project Manager", "Backend Developer", "Frontend Developer"],
        message: "Role must be one of the predefined roles",
      },
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
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
TeamMemberSchema.index({ email: 1 }, { unique: true });
TeamMemberSchema.index({ role: 1 });

export default mongoose.models.TeamMember ||
  mongoose.model<ITeamMember>("TeamMember", TeamMemberSchema);

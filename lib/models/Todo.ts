// models/Todo.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITodo extends Document {
  name: string;
  status: "complete" | "in progress";
  task: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const TodoSchema = new Schema<ITodo>(
  {
    name: {
      type: String,
      required: [true, "Todo name is required"],
      trim: true,
      maxlength: [200, "Todo name cannot exceed 200 characters"],
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
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Task is required"],
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
TodoSchema.index({ status: 1 });
TodoSchema.index({ task: 1 });

export default mongoose.models.Todo ||
  mongoose.model<ITodo>("Todo", TodoSchema);

// models/Client.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IClient extends Document {
  name: string;
  address: string;
  created_at: Date;
  updated_at: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    name: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
      maxlength: [200, "Client name cannot exceed 200 characters"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      maxlength: [500, "Address cannot exceed 500 characters"],
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
ClientSchema.index({ name: 1 });

export default mongoose.models.Client ||
  mongoose.model<IClient>("Client", ClientSchema);

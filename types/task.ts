import { Types } from "mongoose";

// types/task.ts
export interface ITask {
  _id: Types.ObjectId;
  name: string;
  status: "complete" | "in progress";
  assignedTeamMember: Types.ObjectId;
  project: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

// types/project.ts
import { Types } from "mongoose";

export interface IProject {
  _id: Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  tasks: Types.ObjectId[];
  client: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

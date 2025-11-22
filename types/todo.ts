// types/todo.ts
import { Types } from "mongoose";

export interface ITodo {
  _id: Types.ObjectId;
  name: string;
  status: "complete" | "in progress";
  task: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

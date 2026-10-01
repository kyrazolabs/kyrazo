import { Types } from "mongoose";
import { BaseDocument, IUser } from "./index";
import { IUserWorkspace } from "./user.types";

export interface IWorkspace extends BaseDocument {
    name: string;
    description?: string;
    avatar?: string;
    ownerId: Types.ObjectId;
    isDeleted: boolean;
    deletedAt?: Date;
    isArchived?: boolean;

    // Settings
    // settings?: {

    // };

    // Virtual fields
    owner?: IUser;
    users?: IUserWorkspace[];
    projects?: any[]; // Will be defined in project types
  }
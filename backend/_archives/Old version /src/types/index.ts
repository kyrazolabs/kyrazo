import { Types, Document } from 'mongoose';
export * from './endpoint.types'
export * from './user.types'
export * from './webhook.types'
export * from './workspace.types'

export interface BaseDocument extends Document {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
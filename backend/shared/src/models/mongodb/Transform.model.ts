import { Schema, model } from 'mongoose';
import { ITransform, ITransformModel } from '../../types';
import { unprefixId } from '../../utils/id';

const TransformSchema = new Schema<ITransform>(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true,
            index: true,
        },
        namespaceId: {
            type: Schema.Types.ObjectId,
            ref: 'Namespace',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        code: {
            type: String,
            required: true,
        },
        currentVersion: {
            type: Number,
            default: 1,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `trf_${ret._id.toString()}`;
                delete ret._id;
                delete ret.__v;
            },
        },
        toObject: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `trf_${ret._id.toString()}`;
                delete ret._id;
                delete ret.__v;
            },
        },
    }
);

// Indexes
TransformSchema.index({ workspaceId: 1, isActive: 1 });
TransformSchema.index({ name: 'text' });

/**
 * 🔹 Statics
 */
TransformSchema.statics.findByWorkspace = function (workspaceId: string) {
    return this.find({ workspaceId: unprefixId(workspaceId) });
};

TransformSchema.statics.findByNamespace = function (namespaceId: string) {
    return this.find({ namespaceId: unprefixId(namespaceId) });
};

TransformSchema.statics.findActive = function (workspaceId: string, namespaceId: string) {
    return this.find({
        workspaceId: unprefixId(workspaceId),
        namespaceId: unprefixId(namespaceId),
        isActive: true,
    });
};

export const Transform = model<ITransform, ITransformModel>('Transform', TransformSchema);

import { Schema, model } from 'mongoose';
import { IASQS, IASQSModel } from '../../types';
import { unprefixId } from '../../utils/id';

const ASQSSchema = new Schema<IASQS>(
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
        name: { type: String, required: true, trim: true },
        queueUrl: { type: String, required: true, trim: true },
        region: { type: String, required: true, trim: true },
        accessKeyId: { type: String, required: true },
        secretAccessKey: { type: String, required: true, select: false },
        iv: { type: String, required: true, select: false },
        transformer: {
            type: Schema.Types.ObjectId,
            ref: 'Transform',
            required: false,
        },
        isManagedTransform: { type: Boolean, default: false },
        queueType: {
            type: String,
            enum: ['standard', 'fifo'],
            default: 'standard',
            required: true,
        },
        useContentBasedDeduplication: {
            type: Boolean,
            default: false,
        },
        enabled: { type: Boolean, default: true },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `sqs_${ret._id.toString()}`;
                delete ret._id;
                delete ret.__v;
            },
        },
        toObject: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `sqs_${ret._id.toString()}`;
                delete ret._id;
                delete ret.__v;
            },
        },
    }
);

ASQSSchema.index({ workspaceId: 1, namespaceId: 1 });
ASQSSchema.index({ name: 'text', queueUrl: 'text' });

/**
 * 🔹 Statics
 */
ASQSSchema.statics.findByWorkspaceAndNamespace = function (
    workspaceId: string,
    namespaceId: string
) {
    return this.find({
        workspaceId: unprefixId(workspaceId),
        namespaceId: unprefixId(namespaceId),
    });
};

export const ASQS = model<IASQS, IASQSModel>('ASQS', ASQSSchema);

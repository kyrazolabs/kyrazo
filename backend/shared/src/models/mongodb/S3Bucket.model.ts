import { Schema, model } from 'mongoose';
import { IS3Bucket, IS3BucketModel } from '../../types';
import { unprefixId } from '../../utils/id';

const S3BucketSchema = new Schema<IS3Bucket>(
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
        provider: {
            type: String,
            enum: ['aws', 'cloudflare', 'backblaze', 'minio', 'custom'],
            required: true,
            default: 'aws',
        },
        bucketName: { type: String, required: true, trim: true },
        region: { type: String, required: true, trim: true },
        accessKeyId: { type: String, required: true },
        secretAccessKey: { type: String, required: true, select: false },
        iv: { type: String, required: true, select: false },
        endpoint: { type: String, trim: true },
        forcePathStyle: { type: Boolean, default: false },
        transformer: {
            type: Schema.Types.ObjectId,
            ref: 'Transform',
            required: false,
        },
        isManagedTransform: { type: Boolean, default: false },
        enabled: { type: Boolean, default: true },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `s3b_${ret._id.toString()}`;
                delete ret._id;
                delete ret.__v;
            },
        },
        toObject: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `s3b_${ret._id.toString()}`;
                delete ret._id;
                delete ret.__v;
            },
        },
    }
);

S3BucketSchema.index({ workspaceId: 1, namespaceId: 1 });
S3BucketSchema.index({ name: 'text', bucketName: 'text' });

/**
 * 🔹 Statics
 */
S3BucketSchema.statics.findByWorkspaceAndNamespace = function (
    workspaceId: string,
    namespaceId: string
) {
    return this.find({
        workspaceId: unprefixId(workspaceId),
        namespaceId: unprefixId(namespaceId),
    });
};

export const S3Bucket = model<IS3Bucket, IS3BucketModel>('S3Bucket', S3BucketSchema);

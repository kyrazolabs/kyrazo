import { Schema, model } from 'mongoose';
import { ITransformVersion, ITransformVersionModel } from '../../types';
import { unprefixId } from '../../utils/id';

const TransformVersionSchema = new Schema<ITransformVersion>(
    {
        transformId: {
            type: Schema.Types.ObjectId,
            ref: 'Transform',
            required: true,
            index: true,
        },
        version: {
            type: Number,
            required: true,
        },
        code: {
            type: String,
            required: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        toJSON: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `trv_${ret._id.toString()}`;
                delete ret._id;
                delete ret.__v;
            },
        },
        toObject: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `trv_${ret._id.toString()}`;
                delete ret._id;
                delete ret.__v;
            },
        },
    }
);

// Indexes
TransformVersionSchema.index({ transformId: 1, version: 1 }, { unique: true });

/**
 * 🔹 Statics
 */
TransformVersionSchema.statics.findByTransform = function (transformId: string) {
    return this.find({ transformId: unprefixId(transformId) }).sort({ version: -1 });
};

TransformVersionSchema.statics.findByVersion = function (transformId: string, version: number) {
    return this.findOne({ transformId: unprefixId(transformId), version });
};

export const TransformVersion = model<ITransformVersion, ITransformVersionModel>(
    'TransformVersion',
    TransformVersionSchema
);

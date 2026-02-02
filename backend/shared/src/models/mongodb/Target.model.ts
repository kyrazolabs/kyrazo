import { Schema, Types, model } from 'mongoose';
import { ITarget, ITargetModel } from '../../types';

const TargetSchema = new Schema<ITarget>(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true,
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },

        name: { type: String, required: true, trim: true },

        url: { type: String, required: true },
        method: {
            type: String,
            enum: ['POST', 'PUT', 'PATCH'],
            default: 'POST',
            required: true,
        },
        description: { type: String, default: '' },
        enabled: { type: Boolean, default: true },

        userId: { type: Schema.Types.ObjectId, required: true, index: true },

        config: {
            timeout: { type: Number, default: 5000 },
            retryCount: { type: Number, default: 3 },
            rateLimit: { type: Number },
            rateLimitDuration: { type: Number },
        },

        secrets: {
            type: [
                {
                    kid: { type: String, required: true },
                    value_enc: { type: String, required: true },
                    iv: { type: String, required: true },
                    active: { type: Boolean, default: true },
                },
            ],
            _id: false,
            select: false,
            default: [],
        },

        customHeaders: {
            type: Map,
            of: String,
            default: {},
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret: any) {
                delete ret.__v;
            },
        },
    }
);

TargetSchema.index({
    name: 'text',
    description: 'text',
    url: 'text',
});
TargetSchema.index(
    {
        workspaceId: 1,
        projectId: 1,
        url: 1,
        method: 1,
    },
    { unique: true }
);
TargetSchema.index(
    {
        workspaceId: 1,
        projectId: 1,
        enabled: 1,
    },
    { name: 'idx_workspace_project_enabled' }
);

TargetSchema.index(
    {
        workspaceId: 1,
        projectId: 1,
        'secrets.kid': 1,
        'secrets.active': 1,
    },
    { name: 'idx_workspace_project_kid_active' }
);

TargetSchema.pre('save', function () {
    if (!this.secrets) {
        throw new Error('Secrets are required');
    }
    const actives = this.secrets.filter(s => s.active);
    if (actives.length > 1) {
        throw new Error('Only one active secret is allowed per target');
    }
});

/**
 * 🔹 Virtuals
 */
TargetSchema.virtual('isDisabled').get(function (this: ITarget) {
    return !this.enabled;
});

/**
 * 🔹 Static Methods
 */
TargetSchema.statics.findByWorkspaceAndProject = function (
    workspaceId: string,
    projectId: string
) {
    return this.find({ workspaceId, projectId });
};

TargetSchema.statics.findActiveByWorkspaceAndProject = function (
    workspaceId: string,
    projectId: string
) {
    return this.find({ enabled: true, projectId, workspaceId });
};

TargetSchema.statics.findActiveByWorkspaceAndProjectAndTargetId = function (
    workspaceId: string,
    projectId: string,
    targetId: string
) {
    return this.findOne({
        enabled: true,
        projectId,
        workspaceId,
        _id: new Types.ObjectId(targetId),
    });
};

TargetSchema.statics.findActiveByWorkspaceAndProjectAndTargetIds = function (
    workspaceId: string,
    projectId: string,
    targetIds: string[]
): Promise<ITarget[]> {
    return this.find({
        enabled: true,
        workspaceId,
        projectId,
        _id: { $in: targetIds.map(id => new Types.ObjectId(id)) },
    });
};

TargetSchema.pre('save', async function () {
    // 1. URL Validation
    if (this.isModified('url')) {
        try {
            const url = new URL(this.url);
            if (!['http:', 'https:'].includes(url.protocol)) {
                throw new Error('Invalid URL protocol. Must be http or https');
            }
        } catch (error) {
            throw error;
        }
    }
});

export const Target = model<ITarget, ITargetModel>('Target', TargetSchema);

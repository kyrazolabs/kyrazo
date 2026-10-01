import { Schema, Types, model } from 'mongoose';
import { ITarget, ITargetModel } from '../../types';
import { unprefixId } from '../../utils/id';

const TargetSchema = new Schema<ITarget>(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true,
        },
        namespaceId: {
            type: Schema.Types.ObjectId,
            ref: 'Namespace',
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
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `trg_${ret._id.toString()}`;
                delete ret._id;
                delete ret.__v;
            },
        },
        toObject: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `trg_${ret._id.toString()}`;
                delete ret._id;
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
        namespaceId: 1,
        url: 1,
        method: 1,
    },
    { unique: true }
);
TargetSchema.index(
    {
        workspaceId: 1,
        namespaceId: 1,
        enabled: 1,
    },
    { name: 'idx_workspace_namespace_enabled' }
);

TargetSchema.index(
    {
        workspaceId: 1,
        namespaceId: 1,
        'secrets.kid': 1,
        'secrets.active': 1,
    },
    { name: 'idx_workspace_namespace_kid_active' }
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
TargetSchema.statics.findByWorkspaceAndNamespace = function (
    workspaceId: string,
    namespaceId: string
) {
    return this.find({
        workspaceId: unprefixId(workspaceId),
        namespaceId: unprefixId(namespaceId),
    });
};

TargetSchema.statics.findActiveByWorkspaceAndNamespace = function (
    workspaceId: string,
    namespaceId: string
) {
    return this.find({
        enabled: true,
        namespaceId: unprefixId(namespaceId),
        workspaceId: unprefixId(workspaceId),
    });
};

TargetSchema.statics.findActiveByWorkspaceAndNamespaceAndTargetId = function (
    workspaceId: string,
    namespaceId: string,
    targetId: string
) {
    return this.findOne({
        enabled: true,
        namespaceId: unprefixId(namespaceId),
        workspaceId: unprefixId(workspaceId),
        _id: unprefixId(targetId),
    });
};

TargetSchema.statics.findActiveByWorkspaceAndNamespaceAndTargetIds = function (
    workspaceId: string,
    namespaceId: string,
    targetIds: string[]
): Promise<ITarget[]> {
    return this.find({
        enabled: true,
        workspaceId: unprefixId(workspaceId),
        namespaceId: unprefixId(namespaceId),
        _id: { $in: targetIds.map(id => unprefixId(id)).filter((id): id is string => !!id) },
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
        } catch (error: any) {
            throw error;
        }
    }
});

export const Target = model<ITarget, ITargetModel>('Target', TargetSchema);

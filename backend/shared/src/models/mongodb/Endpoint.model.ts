import { Schema, Types, model } from 'mongoose';

import { IEndpoint, IEndpointModel } from '../../types';

const EndpointSchema = new Schema<IEndpoint>(
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
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        url: { type: String, required: true },
        method: {
            type: String,
            enum: ['POST', 'PUT', 'PATCH', 'GET', 'DELETE'],
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
    { timestamps: true }
);

EndpointSchema.index({
    name: 'text',
    description: 'text',
    url: 'text',
});
EndpointSchema.index(
    {
        workspaceId: 1,
        projectId: 1,
        url: 1,
        method: 1,
    },
    { unique: true }
);
EndpointSchema.index(
    {
        workspaceId: 1,
        projectId: 1,
        enabled: 1,
    },
    { name: 'idx_workspace_project_enabled' }
);

EndpointSchema.index(
    {
        workspaceId: 1,
        projectId: 1,
        'secrets.kid': 1,
        'secrets.active': 1,
    },
    { name: 'idx_workspace_project_kid_active' }
);

/**
 * 🔹 Virtuals
 */
EndpointSchema.virtual('isDisabled').get(function (this: IEndpoint) {
    return !this.enabled || this.status === 'inactive';
});

/**
 * 🔹 Static Methods
 */
EndpointSchema.statics.findByWorkspaceAndProject = function (
    workspaceId: string,
    projectId: string
) {
    return this.find({ workspaceId, projectId });
};

EndpointSchema.statics.findActiveByWorkspaceAndProject = function (
    workspaceId: string,
    projectId: string
) {
    return this.find({ enabled: true, projectId, workspaceId });
};

EndpointSchema.statics.findActiveByWorkspaceAndProjectAndIds = function (
    workspaceId: string,
    projectId: string,
    endpointIds: string[]
): Promise<IEndpoint[]> {
    return this.find({
        enabled: true,
        workspaceId,
        projectId,
        _id: { $in: endpointIds.map(id => new Types.ObjectId(id)) },
    });
};

EndpointSchema.statics.findActiveByWorkspaceAndProjectAndId = function (
    workspaceId: string,
    projectId: string,
    endpointId: string
) {
    return this.findOne({
        enabled: true,
        projectId,
        workspaceId,
        _id: new Types.ObjectId(endpointId),
    });
};

EndpointSchema.pre('save', async function () {
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

// IngressEndpointSchema.pre('save', function (next) {
//     if (this.type === IngressType.RECEIVE) {
//         return next(new Error('Ingress Endpoints of type "receive" must have a "producesEventType" field.'));
//     }
//     if (this.type === IngressType.FORWARD && !this.targetUrl) {
//         return next(new Error('Ingress Endpoints of type "forward" must have a "targetUrl" field.'));
//     }
//     next();
// });

export const Endpoint = model<IEndpoint, IEndpointModel>(
    'Endpoint',
    EndpointSchema
);

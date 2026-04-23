import { Schema, Types, model } from 'mongoose';
import { IEndpoint, IEndpointModel } from '../../types';
import { unprefixId } from '../../utils/id';

const EndpointSchema = new Schema<IEndpoint>(
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
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        url: { type: String, required: true },
        method: {
            type: String,
            enum: ['POST', 'PUT', 'PATCH'],
            default: 'POST',
            required: true,
        },
        description: { type: String, default: '' },
        enabled: { type: Boolean, default: true },
        transformer: { type: Schema.Types.ObjectId, ref: 'Transform' },
        isManagedTransform: { type: Boolean, default: false },

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
                ret.id = `end_${ret._id.toString()}`;
                if (ret.transformer) ret.transformer = `trn_${ret.transformer.toString()}`;
                delete ret._id;
                delete ret.__v;
            },
        },
        toObject: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `end_${ret._id.toString()}`;
                if (ret.transformer) ret.transformer = `trn_${ret.transformer.toString()}`;
                delete ret._id;
                delete ret.__v;
            },
        },
    }
);

EndpointSchema.index({
    name: 'text',
    description: 'text',
    url: 'text',
});
EndpointSchema.index(
    {
        workspaceId: 1,
        namespaceId: 1,
        url: 1,
        method: 1,
    },
    { unique: true }
);
EndpointSchema.index(
    {
        workspaceId: 1,
        namespaceId: 1,
        enabled: 1,
    },
    { name: 'idx_workspace_namespace_enabled' }
);

EndpointSchema.index(
    {
        workspaceId: 1,
        namespaceId: 1,
        'secrets.kid': 1,
        'secrets.active': 1,
    },
    { name: 'idx_workspace_namespace_kid_active' }
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
EndpointSchema.statics.findByWorkspaceAndNamespace = function (
    workspaceId: string,
    namespaceId: string
) {
    return this.find({
        workspaceId: unprefixId(workspaceId),
        namespaceId: unprefixId(namespaceId),
    });
};

EndpointSchema.statics.findActiveByWorkspaceAndNamespace = function (
    workspaceId: string,
    namespaceId: string
) {
    return this.find({
        enabled: true,
        namespaceId: unprefixId(namespaceId),
        workspaceId: unprefixId(workspaceId),
    });
};

EndpointSchema.statics.findActiveByWorkspaceAndNamespaceAndIds = function (
    workspaceId: string,
    namespaceId: string,
    endpointIds: string[]
): Promise<IEndpoint[]> {
    return this.find({
        enabled: true,
        workspaceId: unprefixId(workspaceId),
        namespaceId: unprefixId(namespaceId),
        _id: { $in: endpointIds.map(id => unprefixId(id)).filter((id): id is string => !!id) },
    });
};

EndpointSchema.statics.findActiveByWorkspaceAndNamespaceAndId = function (
    workspaceId: string,
    namespaceId: string,
    endpointId: string
) {
    return this.findOne({
        enabled: true,
        namespaceId: unprefixId(namespaceId),
        workspaceId: unprefixId(workspaceId),
        _id: unprefixId(endpointId),
    });
};

EndpointSchema.pre('save', async function () {
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

// IngressEndpointSchema.pre('save', function (next) {
//     if (this.type === IngressType.RECEIVE) {
//         return next(new Error('Ingress Endpoints of type "receive" must have a "producesEventType" field.'));
//     }
//     if (this.type === IngressType.FORWARD && !this.targetUrl) {
//         return next(new Error('Ingress Endpoints of type "forward" must have a "targetUrl" field.'));
//     }
//     next();
// });

export const Endpoint = model<IEndpoint, IEndpointModel>('Endpoint', EndpointSchema);

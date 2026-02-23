import { Schema, model } from 'mongoose';
import { ISource, ISourceAuthentication, ISourceModel } from '../../types';
import { unprefixId } from '../../utils/id';

const AuthenticationSchema = new Schema<ISourceAuthentication>(
    {
        enabled: { type: Boolean, default: false },
        type: {
            type: String,
            enum: ['hmac', 'api_key', 'basic_auth', 'service'],
            required: function (this: ISourceAuthentication): boolean {
                return this.enabled;
            },
        },
        credentials: {
            type: Schema.Types.Mixed,
            required: false,
        },

        // service: {
        //     secret: { type: String, required: false },
        //     iv: { type: String, required: false },
        // },
        // hmac: {
        //     algorithm: {
        //         type: String,
        //         enum: ["sha1", "sha256", "sha512", "md5"],
        //         required: false,
        //     },
        //     encoding: {
        //         type: String,
        //         enum: ["base64", "base64url", "hex"],
        //         required: false,
        //     },
        //     signatureHeaderKey: { type: String, required: false },
        //     signingSecret: { type: String, required: false },
        //     iv: { type: String, required: false },
        // },
        // apiKey: {
        //     headerKey: { type: String, required: false },
        //     apiKey: { type: String, required: false },
        //     iv: { type: String, required: false },
        // },
        // basicAuth: {
        //     username: { type: String, required: false },
        //     password: { type: String, required: false },
        //     iv: { type: String, required: false },
        // },
    },
    { _id: false }
);

// Represents a subscription that connects event types to endpoints.
const SourceSchema = new Schema<ISource>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true,
            index: true,
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
            index: true,
        },
        name: { type: String, required: true, trim: true },
        description: { type: String },

        service: { type: String, enum: ['stripe', 'paypal'] },

        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },

        ingressId: { type: String, required: true, unique: true, sparse: true },
        ingressUrl: { type: String, required: true, unique: true, sparse: true },

        // forwarding
        forwarding: { type: Boolean, default: false },
        endpoints: [{ type: Schema.Types.ObjectId, ref: 'Endpoint' }],

        // Event types (optional now)
        eventTypes: [{ type: String }],

        // Retry policy
        retryPolicy: {
            maxAttempts: { type: Number, default: 3 },
        },

        // Authentication config
        authentication: {
            type: AuthenticationSchema,
            required: false,
            default: {},
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `src_${ret._id.toString()}`;
                delete ret._id;
                delete ret.__v;
            },
        },
        toObject: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `src_${ret._id.toString()}`;
                delete ret._id;
                delete ret.__v;
            },
        },
    }
);

SourceSchema.index({ name: 'text' });

AuthenticationSchema.pre('validate', function () {
    if (!this.enabled) {
        this.credentials = null as any;
        this.type = undefined;
        return;
    }

    if (this.enabled && (!this.type || !this.credentials)) {
        return new Error(
            'Authentication type and credentials are required when authentication is enabled.'
        );
    }

    if (!this.type || !this.credentials) {
        return new Error(
            'Authentication type and credentials are required when authentication is enabled.'
        );
    }

    const creds = this.credentials as Record<string, any>;

    switch (this.type) {
        case 'api_key':
            if (!creds.headerKey || !creds.apiKey || !creds.iv) {
                return new Error('API Key authentication requires: headerKey, apiKey, and iv.');
            }
            break;

        case 'basic_auth':
            if (!creds.username || !creds.password || !creds.iv) {
                return new Error('Basic Auth requires: username, password, and iv.');
            }
            break;

        case 'service':
            if (!creds.secret || !creds.iv) {
                return new Error('Service authentication requires: secret and iv.');
            }
            break;

        default:
            return new Error(`Unknown authentication type: ${this.type}`);
    }
});
/**
 * 🔹 Virtuals
 */
SourceSchema.virtual('isDisabled').get(function (this: ISource) {
    return this.status === 'inactive';
});

/**
 * 🔹 Statics
 */
SourceSchema.statics.findByUser = function (userId: string) {
    return this.find({ userId: unprefixId(userId) });
};

SourceSchema.statics.findByWorkspace = function (workspaceId: string) {
    return this.find({ workspaceId: unprefixId(workspaceId) });
};

SourceSchema.statics.findByProject = function (projectId: string) {
    return this.find({ projectId: unprefixId(projectId) });
};

SourceSchema.statics.findActive = function () {
    return this.find({ status: 'active' });
};

export const Source = model<ISource, ISourceModel>('Source', SourceSchema);

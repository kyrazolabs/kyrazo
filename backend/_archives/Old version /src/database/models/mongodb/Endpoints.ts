import { Schema, model } from "mongoose";

import { IEndpoint, IEndpointModel, IngressType, IIngressEndpoint } from "@/types";

const EndpointSchema = new Schema<IEndpoint>({
    workspaceId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },
    url: { type: String, required: true },
    method: {
        type: String,
        enum: ["POST", "PUT", "PATCH", "GET", "DELETE"],
        required: true,
    },
    description: { type: String, default: "" },
    enabled: { type: Boolean, default: true },

    userId: { type: Schema.Types.ObjectId, required: true, index: true },

    config: {
        timeout: { type: Number, default: 5000 },
        retryCount: { type: Number, default: 3 },
        rateLimit: { type: Number },
    },

    customHeaders: {
        type: Map,
        of: String,
        default: {},
    },
}, { timestamps: true });


const IngressEndpointSchema = new Schema<IIngressEndpoint>({
    ingressId: { type: String, required: true, unique: true },
    workspaceId: { type: String, required: true },
    webhookId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    
    type: { type: String, enum: Object.values(IngressType), required: true },
    source: { type: String, required: true },
    targetUrls: [{ type: String }],
    authenticating: { type: Boolean },

    isActive: { type: Boolean, default: true },
}, { timestamps: true });



EndpointSchema.index({ name: "text" })

/**
 * 🔹 Virtuals
 */
EndpointSchema.virtual("isDisabled").get(function (this: IEndpoint) {
    return !this.enabled || this.status === "inactive";
});

/**
 * 🔹 Static Methods
 */
EndpointSchema.statics.findByUser = function (userId: string) {
    return this.find({ userId });
};

EndpointSchema.statics.findActive = function () {
    return this.find({ status: "active", enabled: true });
};


EndpointSchema.pre('save', async function(next) {
    const existing = await this.constructor.findOne({
        userId: this.userId,
        url: this.url
    });

    if (existing) {
        const err = new Error("This endpoint already exists for this user.");
        return next(err);
    }
    
    next();
})

// IngressEndpointSchema.pre('save', function (next) {
//     if (this.type === IngressType.RECEIVE) {
//         return next(new Error('Ingress Endpoints of type "receive" must have a "producesEventType" field.'));
//     }
//     if (this.type === IngressType.FORWARD && !this.targetUrl) {
//         return next(new Error('Ingress Endpoints of type "forward" must have a "targetUrl" field.'));
//     }
//     next();
// });

export const Endpoint = model<IEndpoint, IEndpointModel>("Endpoint", EndpointSchema);
export const IngressEndpoint = model<IIngressEndpoint>('IngressEndpoint', IngressEndpointSchema);
  
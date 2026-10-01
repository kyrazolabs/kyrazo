import { Schema, model } from "mongoose";
import { IWebhook, IWebhookAuthentication, IWebhookModel } from "@/types";

export enum WebhookType {
    RECEIVE = "receive",
    PUBLISH = "publish",
    FORWARD = "forward",
}

const AuthenticationSchema = new Schema<IWebhookAuthentication>({
    enabled: { type: Boolean, default: false },
    type: {
        type: String,
        enum: ["hmac", "api_key", "basic_auth", "service"],
        required: false,
    },
    service: {
        secret: { type: String, required: false },
        iv: { type: String, required: false },
    },
    hmac: {
        algorithm: {
            type: String,
            enum: ["sha1", "sha256", "sha512", "md5"],
            required: false,
        },
        encoding: {
            type: String,
            enum: ["base64", "base64url", "hex"],
            required: false,
        },
        signatureHeaderKey: { type: String, required: false },
        signingSecret: { type: String, required: false },
        iv: { type: String, required: false },
    },
    apiKey: {
        headerKey: { type: String, required: false },
        apiKey: { type: String, required: false },
        iv: { type: String, required: false },
    },
    basicAuth: {
        username: { type: String, required: false },
        password: { type: String, required: false },
        iv: { type: String, required: false },
    }, 
}, { _id: false });

// Represents a subscription that connects event types to endpoints.
const WebhookSchema = new Schema<IWebhook>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
            index: true,
        },
        name: { type: String, required: true, trim: true },
        description: { type: String },

        type: { type: String, enum: WebhookType, required: true },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },

        // forwarding
        forwarding: { type: Boolean, default: false },
        endpoints: [{ type: Schema.Types.ObjectId, ref: "Endpoint" }],

        // Event types (optional now)
        eventTypes: [{ type: String }],

        // Retry policy
        retryPolicy: {
            maxAttempts: { type: Number, default: 3 },
        },

        // Authentication config
        authentication: { type: AuthenticationSchema, required: false, default: {} },
    },
    { timestamps: true }
);

WebhookSchema.index({ name: "text" });

AuthenticationSchema.pre("validate", function (next) {
  if (!this.enabled) return next();

  const authTypes = [];

  // Check if service auth is being used (has secret and iv)
  if (this.service && this.service.secret && this.service.iv) {
    authTypes.push('service');
  }

  // Check if hmac auth is being used (has algorithm, encoding, signatureHeaderKey, signingSecret, iv)
  if (this.hmac &&
      this.hmac.algorithm &&
      this.hmac.encoding &&
      this.hmac.signatureHeaderKey &&
      this.hmac.signingSecret &&
      this.hmac.iv) {
    authTypes.push('hmac');
  }

  // Check if api_key auth is being used (has headerKey, apiKey, iv)
  if (this.apiKey &&
      this.apiKey.headerKey &&
      this.apiKey.apiKey &&
      this.apiKey.iv) {
    authTypes.push('api_key');
  }

  // Check if basic_auth is being used (has username, password, iv)
  if (this.basicAuth &&
      this.basicAuth.username &&
      this.basicAuth.password &&
      this.basicAuth.iv) {
    authTypes.push('basic_auth');
  }

  if (authTypes.length > 1) {
    return next(
      new Error("Only one authentication type can be used at a time")
    );
  }

  next();
});
/**
 * 🔹 Virtuals
 */
WebhookSchema.virtual("isDisabled").get(function (this: IWebhook) {
    return this.status === "inactive";
});

/**
 * 🔹 Statics
 */
WebhookSchema.statics.findByUser = function (userId: string) {
    return this.find({ userId: userId });
};

WebhookSchema.statics.findActive = function () {
    return this.find({ status: "active" });
};

export const Webhook = model<IWebhook, IWebhookModel>("Webhook", WebhookSchema);

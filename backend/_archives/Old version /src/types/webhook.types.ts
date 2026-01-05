import { Document, Model, Types } from "mongoose";
import {
    WebhookType,
    WebhookService,
    WebhookAuthType,
    WebhookAuthHmacAlgorithm,
    WebhookAuthHmacEncoding,
    WebhookStatus,
} from "@/validations";

export interface IWebhookAuthentication {
    enabled: boolean;
    type: WebhookAuthType;
    service?: {
        secret: string;
        iv: string;
    };
    hmac?: {
        algorithm: WebhookAuthHmacAlgorithm;
        encoding: WebhookAuthHmacEncoding;
        signatureHeaderKey: string;
        signingSecret: string;
        iv: string;
    };
    apiKey?: {
        headerKey: string;
        apiKey: string;
        iv: string;
    };
    basicAuth?: {
        username: string;
        password: string;
        iv: string;
    };
}

export interface IWebhook extends Document {
    userId: Types.ObjectId;
    workspaceId: Types.ObjectId;
    name: string;
    description?: string;
    status: WebhookStatus;

    service: WebhookService;
    type: WebhookType;

    forwarding: boolean;
    endpoints: Array<Types.ObjectId[] | any>;
    ingressIds?: Types.ObjectId[];

    eventTypes?: string[];

    // Authentication
    authentication?: IWebhookAuthentication;

    retryPolicy: {
        maxAttempts: number;
    };
}

export interface IWebhookModel extends Model<IWebhook> {
    findByUser(userId: string): Promise<IWebhook[]>;
    findActive(): Promise<IWebhook[]>;
}

export interface ISearchWebhook {
    q: string;
    status: WebhookStatus;
    limit: number;
    page: number;
}

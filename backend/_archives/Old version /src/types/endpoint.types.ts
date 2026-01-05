import { Document, Model, Types } from "mongoose";

export type EndpointStatus = 'active' | 'inactive';
export type EndpointMethods = 'POST' | 'PUT' | 'PATCH' | 'GET' | 'DELETE';
export enum IngressType { RECEIVE = 'receive', FORWARD = 'forward' }

export interface IEndpoint<T = string> extends Document {
    _id: string;
    workspaceId: string;
    name: string;
    status: EndpointStatus;
    url: string;
    method: EndpointMethods;
    description: string;
    enabled: boolean;

    userId: Types.ObjectId;

    config: {
        timeout: number;
        retryCount: number;
        rateLimit?: number;
    };

    customHeaders?: {
        [key: string]: T;
    };
}

export interface IEndpointModel extends Model<IEndpoint> {
    findByUser(userId: string): Promise<IEndpoint[]>;
    findActive(): Promise<IEndpoint[]>;
}

export interface ISearchEndpoint {
  q: string;
  status: EndpointStatus;
  limit: number;
  page: number;
}

export interface IIngressEndpoint extends Document {
    ingressId: string; // The unique ID for the URL, e.g., 'ing_abc123'
    workspaceId: string;
    webhookId: string;
    userId: Types.ObjectId;

    type: IngressType; // Determines the behavior: receive or forward.

    source: string; // A name for the source, e.g., 'Stripe Payments', 'GitHub Repos'

    // --- For 'RECEIVE' type ---
    // If the type is 'receive', what event type should be created in our system?
    // e.g., a request to this endpoint becomes a 'stripe.payment.succeeded' event.
    // producesEventType?: string;

    // --- For 'FORWARD' type ---
    // If the type is 'forward', where should we send the request?
    targetUrls?: Array<string>;
    authenticating: boolean;

    // --- Common fields ---
    isActive: boolean;

    workspace?: any;
}
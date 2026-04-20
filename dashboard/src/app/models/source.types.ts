import { IEndpoint } from './endpoint.types';
import { IS3Bucket } from './s3.types';
import { IASQSQueue } from './asqs.types';
import { ITransform } from './transform.types';

export enum SourceStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    PAUSED = 'paused',
}
export enum SourceType {
    RECEIVE = 'receive',
    PUBLISH = 'publish',
    FORWARD = 'forward',
}
export enum SignatureAlgorithm {
    HMAC_SHA256 = 'hmac-sha256',
    HMAC_SHA1 = 'hmac-sha1',
}
export enum backoffStrategy {
    EXPONENTIAL = 'exponential',
    FIXED = 'fixed',
}

export interface ISource {
    id: string;
    userId: string;
    workspaceId: string;
    name: string;
    description: string;
    status: SourceStatus;

    type: SourceType;
    endpoints?: IEndpoint[];
    // ingressIds: Array<string>;
    events: Array<string>;
    eventTypes: Array<string>;

    // secret: string;
    // iv: string;
    // isEnabled: boolean;
    // signatureAlgorithm: SignatureAlgorithm;

    ingressId?: string;
    ingressUrl?: string;
    service?: string;
    forwarding?: boolean;

    retryPolicy: {
        maxAttempts: number;
        backoffStrategy: backoffStrategy;
        interval: number;
    };

    // V2 Fields
    transformId?: string | ITransform;
    isManagedTransform?: boolean;
    destination?: {
        endpoints?: string[] | IEndpoint[];
        s3bucket?: string[] | IS3Bucket[];
        asqs?: string[] | IASQSQueue[];
    };
}

export interface CreateSourceRequest {
    name: string;
    description?: string;
    status: SourceStatus;

    type: SourceType;
    service?: string; // Required for receive webhooks
    eventTypes?: Array<string>;
    endpoints?: Array<string>; // Required for forward webhooks

    // Receive webhook specific fields
    forwarding?: boolean;

    retryPolicy?: {
        maxAttempts: number;
        backoffStrategy: backoffStrategy;
        interval: number;
    };

    authentication?: {
        enabled?: boolean;
        type?: string;
        service?: { secret: string };
        hmac?: {
            algorithm: string;
            encoding: string;
            signatureHeaderKey: string;
            webhookSigningSecret: string;
        };
        basicAuth?: { username: string; password: string };
        apiKey?: { headerKey: string; apiKey: string };
    };

    secret?: string;

    // V2 Fields
    transformer?: {
        name?: string;
        description?: string;
        code: string;
    };
    destination?: {
        endpoints?: string[] | IEndpoint[];
        s3bucket?: string[] | IS3Bucket[];
        asqs?: string[] | IASQSQueue[];
    };
}

export interface CreateSourceResponse {
    id: string;
    secret?: string;
    ingress?: string;
    ingressUrl?: string; // Correct for V2
}

export interface UpdateSourceRequest {
    name?: string;
    description?: string;
    status?: SourceStatus;

    type?: SourceType;
    eventTypes?: Array<string>;
    forwarding?: boolean;
    endpoints?: Array<string>;

    retryPolicy?: {
        maxAttempts?: number;
        backoffStrategy?: backoffStrategy;
        interval?: number;
    };

    // V2 Fields
    transformer?: {
        name?: string;
        description?: string;
        code: string;
    };
    destination?: {
        endpoints?: string[] | IEndpoint[];
        s3bucket?: string[] | IS3Bucket[];
        asqs?: string[] | IASQSQueue[];
    };
}

export interface UpdateSourceAuthRequest {
    authentication: {
        enabled: boolean;
        type: string;
        service?: {
            secret: string;
        };
    };
}

export interface UpdateSourceResponse extends ISource {}

export interface GetSourceResponse {
    id: string;
    userId: string;
    workspaceId: string;
    name: string;
    description: string;
    status: SourceStatus;

    type: SourceType;
    endpoints?: IEndpoint[];
    // ingressIds: Array<string>;
    ingressId?: string;
    ingressUrl?: string;
    service?: string;
    forwarding?: boolean;

    // V2 Fields
    transformId?: string | ITransform;
    isManagedTransform?: boolean;
    destination?: {
        endpoints?: string[] | IEndpoint[];
        s3bucket?: string[] | IS3Bucket[];
        asqs?: string[] | IASQSQueue[];
    };

    events: Array<string>;
    eventTypes: Array<string>;

    // secret: string;
    // iv: string;
    // isEnabled: boolean;
    // signatureAlgorithm: SignatureAlgorithm;

    authentication: {
        enabled: boolean;
        type: string;
        credentials: any;
    };

    retryPolicy: {
        maxAttempts: number;
        backoffStrategy: backoffStrategy;
        interval: number;
    };
}

export interface GetSourcesResponse {
    id: string;
    userId: string;
    workspaceId: string;
    name: string;
    description: string;
    status: SourceStatus;

    type: SourceType;
    service?: string; // Added service property
    // endpointIds: Array<string>;
    // ingressIds: Array<string>;
    events: Array<string>;
    eventTypes: Array<string>;

    // secret: string;
    // iv: string;
    // isEnabled: boolean;
    // signatureAlgorithm: SignatureAlgorithm;

    retryPolicy: {
        maxAttempts: number;
        backoffStrategy: backoffStrategy;
        interval: number;
    };
}

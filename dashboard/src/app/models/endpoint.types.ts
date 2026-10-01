export type EndpointStatus = 'active' | 'inactive';
export type EndpointMethods = 'POST' | 'PUT' | 'PATCH' | 'GET' | 'DELETE';
export enum IngressType {
    RECEIVE = 'receive',
    FORWARD = 'forward',
}

export interface IEndpoint<T = string> {
    id: string;
    name: string;
    status: EndpointStatus;
    url: string;
    method: EndpointMethods;
    description: string;
    enabled: boolean;
    transformer?: string | any;
    isManagedTransform: boolean;

    userId: string;

    config: {
        timeout: number;
        retryCount: number;
        rateLimit?: number;
    };

    customHeaders?: {
        [key: string]: T;
    };

    createdAt: string;
}

export interface EndpointStats {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
}

export interface Endpoint extends IEndpoint {
    stats: EndpointStats;
}

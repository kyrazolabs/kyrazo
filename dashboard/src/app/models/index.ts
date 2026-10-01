// Authentication & User Management
export interface User {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    name: string; // Computed from firstName + lastName
    avatar: string | null;
    phone: string | null;
    address: string | null;
    role: string; // You might want to add this to your backend
    isActive: boolean;
    lastLogin: string;
    bio: string | null;
    timeZone: string;
    language: string;
    workspace?: Workspace; // Optional if you want to include workspace data
    createdAt: string;
    updatedAt: string;
}

// Workspace interface
export interface Workspace {
    id: string;
    name: string;
    slug: string;
    webhookBaseUrl: string;
    plan: string;
    createdAt: string;
}

// Auth response interface - updated to match your needs
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
    expiresIn: number;
    expiresAt: string;
}

// Login request interface
export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
}

// Signup request interface
export interface SignupRequest {
    name?: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    username?: string;
}

// Optional: Type for auth errors
export interface AuthError {
    code: string;
    message: string;
}
// Webhook Management
export interface Webhook {
    id: string;
    name: string;
    description?: string;
    status: 'active' | 'paused';
    type: 'publish' | 'receive' | 'forward';
    eventTypes: string[];
    retryPolicy: RetryPolicy;
    signature: Signature;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    endpointCount?: number;
    lastDeliveryAt?: string;
}

export interface RetryPolicy {
    maxAttempts: number;
    backoff: 'fixed' | 'exponential';
    intervalMs: number;
}

export interface Signature {
    algo: 'HMAC-SHA256';
    secretId: string;
}

export interface CreateWebhookRequest {
    name: string;
    description?: string;
    type: 'publish' | 'receive' | 'forward';
    eventTypes: string[];
    retryPolicy: RetryPolicy;
    signature: Signature;
    tags?: string[];
}

export interface UpdateWebhookRequest extends Partial<CreateWebhookRequest> {
    status?: 'active' | 'paused';
}

// Endpoint Management
export interface Endpoint {
    id: string;
    webhookId: string;
    url: string;
    method: 'POST' | 'PUT' | 'PATCH';
    headers: Record<string, string>;
    timeoutMs: number;
    verifySSL: boolean;
    rateLimit?: number;
    enabled: boolean;
    createdAt: string;
}

export interface CreateEndpointRequest {
    url: string;
    method: 'POST' | 'PUT' | 'PATCH';
    headers: Record<string, string>;
    timeoutMs: number;
    verifySSL: boolean;
    rateLimit?: number;
}

export interface TestEndpointRequest {
    endpointId: string;
    payload: any;
    eventType: string;
}

export interface TestEndpointResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
    latencyMs: number;
    error?: string;
}

// Delivery Tracking
export interface Delivery {
    id: string;
    webhookId: string;
    endpointId: string;
    status: 'success' | 'failed' | 'pending';
    attempts: Attempt[];
    responseCode?: number;
    latencyMs?: number;
    createdAt: string;
    correlationId?: string;
    eventType: string;
    payload: any;
}

export interface Attempt {
    n: number;
    statusCode?: number;
    error?: string;
    latencyMs?: number;
    at: string;
    requestHeaders: Record<string, string>;
    responseHeaders?: Record<string, string>;
    responseBody?: string;
}

export interface RetryDeliveryRequest {
    deliveryId: string;
}

// Secret Management
export interface Secret {
    id: string;
    name: string;
    maskedValue: string;
    status: 'active' | 'grace' | 'revoked';
    createdAt: string;
    lastUsedAt?: string;
    rotatedAt?: string;
}

export interface CreateSecretRequest {
    name: string;
}

export interface SecretWithValue extends Secret {
    value: string;
}

// Analytics
export interface Analytics {
    successRate: MetricPoint[];
    volumeByEventType: EventVolumePoint[];
    latencyP95: MetricPoint[];
    failuresByCode: CodeFailurePoint[];
}

export interface MetricPoint {
    timestamp: string;
    value: number;
}

export interface EventVolumePoint {
    eventType: string;
    count: number;
    timestamp: string;
}

export interface CodeFailurePoint {
    codeRange: string;
    count: number;
    percentage: number;
}

export interface AnalyticsFilters {
    timeRange: '24h' | '7d' | '30d' | 'custom';
    startDate?: string;
    endDate?: string;
    webhookIds?: string[];
    eventTypes?: string[];
}

// Events & Playground
export interface EventTemplate {
    id: string;
    name: string;
    description: string;
    eventType: string;
    schema: any;
    example: any;
}

export interface SendTestEventRequest {
    webhookId: string;
    endpointIds: string[];
    eventType: string;
    payload: any;
}

// Common Types
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaginationConfig {
    page: number;
    limit: number;
}

export interface SortConfig {
    field: string;
    direction: 'asc' | 'desc';
}

export interface FilterConfig {
    [key: string]: any;
}

// Filters
export interface WebhookFilters extends FilterConfig {
    search?: string;
    status?: 'active' | 'paused';
    tags?: string[];
    createdBy?: string;
    dateRange?: {
        start: string;
        end: string;
    };
}

export interface DeliveryFilters extends FilterConfig {
    search?: string;
    status?: 'success' | 'failed' | 'pending';
    webhookId?: string;
    endpointId?: string;
    correlationId?: string;
    eventType?: string;
    responseCodeRange?: {
        min: number;
        max: number;
    };
    dateRange?: {
        start: string;
        end: string;
    };
}

// UI Component Interfaces
export interface DataGridColumn<T> {
    key: keyof T | string;
    label: string;
    sortable?: boolean;
    filterable?: boolean;
    type: 'text' | 'number' | 'date' | 'status' | 'custom';
    width?: string;
    render?: (value: any, row: T) => string;
    component?: any;
}

export interface DataGridConfig<T> {
    columns: DataGridColumn<T>[];
    pagination: PaginationConfig;
    sorting?: SortConfig;
    filtering?: FilterConfig;
    actions?: ActionConfig<T>[];
}

export interface ActionConfig<T> {
    label: string;
    icon?: string;
    action: (row: T) => void;
    disabled?: (row: T) => boolean;
    visible?: (row: T) => boolean;
    color?: 'primary' | 'secondary' | 'danger';
}

// Toast & Notification Types
export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'warn' | 'info';
    title: string;
    message?: string;
    duration?: number;
    dismissible?: boolean;
}

// Modal Types
export interface ModalConfig {
    title: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    closable?: boolean;
    backdrop?: boolean;
}

// API Response Types
export interface ApiError {
    message: string;
    code: string;
    statusCode: number;
    details?: any;
}

export interface Pagination {
    total: number;
    page: number;
    limit: number;
    pages: number;
}
export interface ApiResponse<T> {
    success: boolean;
    pagination?: Pagination;
    data: T;
    message?: string;
    error?: string;
    timestamp: Date;
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

// Settings Types
export interface WorkspaceSettings {
    id: string;
    name: string;
    slug: string;
    description?: string;
    webhookBaseUrl: string;
    plan: 'free' | 'pro' | 'enterprise';
    settings: {
        defaultRetryPolicy: RetryPolicy;
        maxWebhooks: number;
        maxEndpoints: number;
        rateLimits: {
            requestsPerMinute: number;
            requestsPerHour: number;
        };
    };
}

export interface TeamMember {
    id: string;
    userId: string;
    workspaceId: string;
    role: 'admin' | 'member' | 'viewer';
    email: string;
    name: string;
    invitedAt: string;
    joinedAt?: string;
    status: 'pending' | 'active' | 'inactive';
}

export interface ApiKey {
    id: string;
    name: string;
    keyPreview: string;
    permissions: string[];
    createdAt: string;
    lastUsedAt?: string;
    expiresAt?: string;
    status: 'active' | 'revoked';
}

export interface WorkerStatus {
    worker_id: string;
    status:
        | 'pending'
        | 'starting'
        | 'running'
        | 'stopping'
        | 'stopped'
        | 'failed';
    created_at: string;
    updated_at: string;
    server_ip: string;
    server_ipv6?: string;
}
export * from './workspaces.types';

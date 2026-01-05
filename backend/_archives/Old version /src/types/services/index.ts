export enum ServiceType {
  GITHUB = 'github',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  SHOPIFY = 'shopify',
  ROUTE = 'route',
  GENERAL = 'general'
}

export interface IServiceHandler {
  serviceType: ServiceType;
  canHandle(eventType: string): boolean;
  process(event: any, targets: any[]): Promise<void>;
}

export interface ITarget {
  targetId: string;
  targetUrl: string;
  workspaceId: string;
  webhookId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeliveryAttempt {
  deliveryId: string;
  targetId: string;
  eventId: string;
  webhookId?: string; // Added for webhook tracking
  target?: string; // Added for target URL tracking
  workspaceId?: string; // Added for workspace tracking
  producerId?: string; // Added for producer tracking
  webhookType?: string; // Added for webhook type tracking
  status: 'pending' | 'processing' | 'delivered' | 'failed';
  attemptNumber: number;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responseCode?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  responseTimeMs?: number;
  error?: string;
  scheduledAt: Date;
  processedAt?: Date;
}
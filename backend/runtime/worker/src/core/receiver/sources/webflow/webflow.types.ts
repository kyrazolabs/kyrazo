export interface WebflowWebhookPayload {
    triggerType: string;
    siteId: string;
    workspaceId: string;
    timestamp: number;
    payload: {
        _id?: string;
        [key: string]: any;
    };
    [key: string]: any;
}

export interface IWebflowHeaders {
    'x-webflow-signature': string;
    'x-webflow-timestamp': string;
}

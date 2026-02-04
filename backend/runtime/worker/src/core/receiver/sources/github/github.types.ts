export interface GitHubWebhookPayload {
    action?: string;
    repository?: {
        id: number;
        full_name: string;
        [key: string]: any;
    };
    sender?: {
        login: string;
        id: number;
        [key: string]: any;
    };
    [key: string]: any;
}

export interface IGitHubEvent {
    deliveryId: string;
    eventType: string;
    payload: GitHubWebhookPayload;
}

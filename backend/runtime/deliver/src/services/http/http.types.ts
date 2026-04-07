import type { IWebhookHeaders } from "@/core/dispatcher/dispatcher.types";

export interface HttpRequestOptions {
    timeout?: number;
    retry?: number;
    headers?: IWebhookHeaders;
    logResponse?: boolean;
}

export interface HttpRequestResult {
    ok: boolean;
    status: number;
    duration: number;
    data?: any;
    headers?: any;
    error?: string;
}

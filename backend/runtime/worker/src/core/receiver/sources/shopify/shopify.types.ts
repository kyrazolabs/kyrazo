export interface ShopifyWebhookPayload {
    id?: number | string;
    [key: string]: any;
}

export interface IShopifyHeaders {
    'x-shopify-topic': string;
    'x-shopify-hmac-sha256': string;
    'x-shopify-shop-domain': string;
    'x-shopify-api-version'?: string;
    'x-shopify-webhook-id': string;
    'x-shopify-triggered-at'?: string;
}

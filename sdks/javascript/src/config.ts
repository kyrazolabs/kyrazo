/**
 * SDK Configuration options
 */
export interface KyrazoConfig {
    /**
     * Your Kyrazo API key
     */
    apiKey: string;

    /**
     * Base URL for the API (defaults to production)
     */
    baseURL?: string;

    /**
     * Request timeout in milliseconds (default: 30000)
     */
    timeout?: number;

    /**
     * Number of retry attempts for failed requests (default: 3)
     */
    maxRetries?: number;

    /**
     * Custom headers to include in all requests
     */
    headers?: Record<string, string>;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
    baseURL: "https://api.kyrazo.com",
    timeout: 30000,
    maxRetries: 3,
} as const;

/**
 * Resolves user config with defaults
 */
export function resolveConfig(config: KyrazoConfig): Required<Omit<KyrazoConfig, "headers">> & Pick<KyrazoConfig, "headers"> {
    return {
        apiKey: config.apiKey,
        baseURL: config.baseURL ?? DEFAULT_CONFIG.baseURL,
        timeout: config.timeout ?? DEFAULT_CONFIG.timeout,
        maxRetries: config.maxRetries ?? DEFAULT_CONFIG.maxRetries,
        headers: config.headers,
    };
}

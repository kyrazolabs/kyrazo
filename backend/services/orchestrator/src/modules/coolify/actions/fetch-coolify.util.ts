import { config } from '@/common/config';
import got from 'got';

/**
 * Internal REST helper to execute HTTP queries against the Coolify API
 */
export async function fetchCoolify(endpoint: string, options: any = {}) {
    const url = `${config.COOLIFY_API_URL}${endpoint}`;

    // We expect options to resemble typical fetch options
    // e.g. { method: 'POST', body: JSON.stringify({...}) }

    // Convert body string to object for got's 'json' field if needed
    let jsonBody = undefined;
    if (options.body && typeof options.body === 'string') {
        try {
            jsonBody = JSON.parse(options.body);
        } catch (e) {
            // Not JSON
        }
    }

    try {
        const response = await got(url, {
            method: options.method || 'GET',
            headers: {
                Authorization: `Bearer ${config.COOLIFY_API_TOKEN}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...(options.headers || {}),
            },
            // Got takes 'json' for objects or 'body' for raw strings/buffers
            ...(jsonBody ? { json: jsonBody } : options.body ? { body: options.body } : {}),
            // Timeout set to > 60s as requested
            timeout: {
                request: 75000,
            },
            // Setting responseType to json automatically parses the body
            responseType: 'json',
            // Allow 4xx and 5xx errors to be handled manually instead of throwing
            throwHttpErrors: false,
        });

        if (response.statusCode < 200 || response.statusCode >= 300) {
            const error =
                typeof response.body === 'object' ? JSON.stringify(response.body) : response.body;
            throw new Error(`Coolify API error (${response.statusCode}): ${error}`);
        }

        // Some endpoints like DELETE might return empty bodies
        return response.body as any;
    } catch (err: any) {
        if (err.message && err.message.includes('Coolify API error')) {
            throw err;
        }
        // Handle Got-specific timeout errors
        if (err.code === 'ETIMEDOUT' || err.name === 'TimeoutError') {
            throw new Error(`Coolify API error: Request timed out after 75 seconds`);
        }
        throw new Error(`Coolify API error: ${err.message}`);
    }
}

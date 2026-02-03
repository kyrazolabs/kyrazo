import got from "got";
import { logger } from "@kyrazo/shared";
import type { HttpRequestOptions, HttpRequestResult } from "./http.types";

export class HttpRequester {
    private static instance: HttpRequester;
    private constructor() {}
    public static getInstance(): HttpRequester {
        if (!HttpRequester.instance)
            HttpRequester.instance = new HttpRequester();
        return HttpRequester.instance;
    }

    private backoff(attempt: number) {
        return Math.min(1000 * 2 ** attempt, 15_000);
    }

    public async post(
        url: string,
        body: any,
        options?: HttpRequestOptions,
    ): Promise<HttpRequestResult> {
        return this.request("POST", url, body, options);
    }

    public async request(
        method: "POST" | "PUT" | "PATCH" | string,
        url: string,
        body: any,
        options?: HttpRequestOptions,
    ): Promise<HttpRequestResult> {
        const retries = options?.retry ?? 0;
        const timeout = options?.timeout ?? 15_000;
        const headers = options?.headers ?? {};
        let lastError: any | null = null;

        for (let i = 0; i <= retries; i++) {
            const start = Date.now();
            try {
                const response = await got(url, {
                    method: method as any,
                    json: body,
                    headers,
                    timeout: { request: timeout },
                });

                if (options?.logResponse) {
                    logger.debug(
                        `Response from ${url}: ${JSON.stringify(response.body)}`,
                    );
                }

                return {
                    ok: true,
                    status: response.statusCode,
                    data: response.body,
                    headers: response.headers,
                    duration: Date.now() - start,
                };
            } catch (err) {
                lastError = err as any;
                logger.error(
                    `${method} failed (${i + 1}/${retries + 1}) to ${url}: ${
                        lastError.message
                    }`,
                );
                if (i < retries)
                    await new Promise((r) => setTimeout(r, this.backoff(i)));
            }
        }

        return {
            ok: false,
            status: lastError?.response?.statusCode ?? 0,
            duration: 0,
            data: lastError?.response?.body,
            headers: lastError?.response?.headers,
            error: lastError?.message ?? "Unknown HTTP request error",
        };
    }
}

export const httpRequester = HttpRequester.getInstance();

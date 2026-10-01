import got from "got";

export class HttpClient {
    private static instance: HttpClient

    private constructor() {}

    public static getInstance(): HttpClient {
        if (!HttpClient.instance) {
            HttpClient.instance = new HttpClient();
        }
        return HttpClient.instance;
    }

    public async post(
        url: string,
        data: any,
        headers: Record<string, string>
    ): Promise<{ statusCode: number; body: any }> {
        const response = await got.post(url, {
            json: data,
            headers,
            timeout: { request: 30000 },
        });

        return {
            statusCode: response.statusCode,
            body: response.body,
        };
    }

}

export const httpClient = HttpClient.getInstance()
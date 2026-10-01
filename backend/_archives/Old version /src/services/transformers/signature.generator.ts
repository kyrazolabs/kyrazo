import crypto from 'crypto';

export class SignatureGenerator {
    private static instance: SignatureGenerator;

    private constructor() {}

    public static getInstance(): SignatureGenerator {
        if (!SignatureGenerator.instance) {
            SignatureGenerator.instance = new SignatureGenerator();
        }
        return SignatureGenerator.instance;
    }

    /**
     * @title Generates an HMAC signature for a webhook payload using SHA-256.
     * @param payload - The payload to sign.
     * @param secret - The shared secret key for generating the signature.
     * @returns The hex-encoded HMAC signature string.
     */
    private generateHMACSignature(payload: string, secret: string): string {
        return crypto
            .createHmac('sha256', secret)
            .update(payload, 'utf8')
            .digest('hex');
    }

    /**
     * @title Generates a webhook signature header value in the format: "t=<timestamp>,v1=<signature>".
     * @param payload - The webhook payload string.
     * @param secret - The secret key used to generate the signature.
     * @param timestamp - The UNIX timestamp in seconds used in the signature.
     * @returns The formatted webhook signature header string.
     */
    public generateWebhookSignature(payload: string, secret: string, timestamp: number): string {
        const signedPayload = `${timestamp}.${payload}`;
        const signature = this.generateHMACSignature(signedPayload, secret);
        return `t=${timestamp},v1=${signature}`;
    }
}
import crypto from 'crypto';
import { redisConfig } from '@/config';
import { Target, Endpoint, logger, secretCrypto, unprefixId } from '@kyrazo/shared';
import type { SignaturePayload, SignatureResult } from './dispatcher.types';

export class DispatcherSignature {
    private static instance: DispatcherSignature;

    private readonly algorithm = 'sha256';
    private readonly version = 'v1';

    private constructor() {}

    public static getInstance(): DispatcherSignature {
        if (!DispatcherSignature.instance) {
            DispatcherSignature.instance = new DispatcherSignature();
        }
        return DispatcherSignature.instance;
    }

    /**
     * Create a signature using body, timestamp, nonce, version.
     */
    public async sign(
        body: unknown,
        workspaceId: string,
        namespaceId: string,
        targetId: string,
        type: 'target' | 'endpoint' = 'target'
    ): Promise<SignatureResult> {
        let entity: any;
        logger.info(`Sign Type: ${type}`);

        if (type === 'endpoint') {
            entity = await redisConfig.cache(
                `${type}:${targetId}`,
                async () => {
                    return await Endpoint.findOne({
                        _id: unprefixId(targetId),
                        workspaceId,
                        namespaceId,
                    }).select('+secrets');
                },
                60 * 60 * 24
            );
        } else {
            entity = await redisConfig.cache(
                `${type}:${targetId}`,
                async () => {
                    return await Target.findOne({
                        _id: unprefixId(targetId),
                        workspaceId,
                        namespaceId,
                    }).select('+secrets');
                },
                60 * 60 * 24
            );
        }

        if (!entity) {
            throw new Error(
                `${type.charAt(0).toUpperCase() + type.slice(1)} not found: ${targetId}`
            );
        }

        const rawBody = typeof body === 'string' ? body : JSON.stringify(body);

        const payload: SignaturePayload = {
            body: rawBody,
            timestamp: Date.now(),
            nonce: crypto.randomBytes(16).toString('hex'),
            version: this.version,
        };

        const dataToSign = `${payload.version}.${payload.timestamp}.${payload.nonce}.${payload.body}`;

        let secret: string;
        try {
            const activeSecret = entity.secrets?.find(
                (s: any) => s.active || s.active === undefined
            );
            if (activeSecret?.value_enc && activeSecret?.iv) {
                secret = secretCrypto.decrypt(activeSecret.value_enc, activeSecret.iv, namespaceId);
            } else {
                // Fallback to namespace ID
                secret = namespaceId;
            }
        } catch (error: any) {
            logger.error('Decryption failed in signature, using fallback', error);
            secret = namespaceId;
        }

        const signature = crypto
            .createHmac(this.algorithm, secret)
            .update(dataToSign)
            .digest('hex');

        return {
            signature,
            timestamp: payload.timestamp,
            nonce: payload.nonce,
            version: payload.version,
        };
    }

    /**
     * Verify signature from consumer side.
     */
    public verify(
        body: unknown,
        signature: string,
        timestamp: number,
        nonce: string,
        version: string,
        secret: string
    ): boolean {
        const rawBody = typeof body === 'string' ? body : JSON.stringify(body);

        const data = `${version}.${timestamp}.${nonce}.${rawBody}`;

        const expected = crypto.createHmac(this.algorithm, secret).update(data).digest('hex');

        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    }

    /**
     * Create outbound headers.
     */
    public async buildHeaders(result: SignatureResult) {
        return {
            'X-Webhook-Signature': `v1=${result.signature}`,
            'X-Webhook-Timestamp': result.timestamp.toString(),
            'X-Webhook-Nonce': result.nonce,
            'X-Webhook-Version': result.version,
        };
    }
}

export const dispatcherSignature = DispatcherSignature.getInstance();

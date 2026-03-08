import type { IDispatchedEvent, IWebhookHeaders } from './dispatcher.types';
import { Namespace, Subscription, unprefixId } from '@kyrazo/shared';
import { redisConfig } from '../../config';

export class DispatcherHeaders {
    static instance: DispatcherHeaders;

    private constructor() {}

    public static getInstance(): DispatcherHeaders {
        if (!DispatcherHeaders.instance) {
            DispatcherHeaders.instance = new DispatcherHeaders();
        }
        return DispatcherHeaders.instance;
    }

    /**
     * Generates secure webhook headers
     */
    public async buildHeaders(event: IDispatchedEvent, attempt: number): Promise<IWebhookHeaders> {
        const headers: IWebhookHeaders = {
            'X-Webhook-Id': event.id,
            'X-Webhook-Event': event.type,
            'X-Webhook-Timestamp': event.timestamp.toString(), // Default or event timestamp
            'X-Webhook-Workspace': event.workspaceId,
            'X-Webhook-Namespace': event.namespaceId,
            'X-Webhook-Attempt': attempt.toString(),
            'X-Webhook-Signature': '', // To be filled by dispatcher worker
            'X-Webhook-Nonce': '', // To be filled by dispatcher worker
            'X-Webhook-Version': 'v1',
            'X-Webhook-Schema': 'event.v1',
        };

        try {
            // Fetch namespace config (cached in Redis)
            const namespace = await redisConfig.cache(
                `namespace:${unprefixId(event.namespaceId)}:config`,
                async () => {
                    return await Namespace.findById(unprefixId(event.namespaceId)).lean();
                },
                60 * 10 // 10 minutes cache
            );

            const prefix = namespace?.whiteLabelHeaders || 'X-Webhook';

            if (prefix !== 'X-Webhook') {
                // Check if feature is enabled in subscription (cached in Redis)
                const hasFeature = await redisConfig.cache(
                    `workspace:${unprefixId(event.workspaceId)}:feature:whiteLabelHeaders`,
                    async () => {
                        const subscription = await Subscription.findOne({
                            workspaceId: unprefixId(event.workspaceId),
                            status: 'active',
                        });
                        return !!subscription?.planSnapshot?.features?.whiteLabelHeaders;
                    },
                    60 * 15 // 15 minutes cache
                );

                if (hasFeature) {
                    // Rename default headers to use custom prefix
                    const baseHeaders = { ...headers };
                    // Clear base headers
                    Object.keys(baseHeaders).forEach(key => delete headers[key]);
                    // Re-apply with new prefix
                    Object.entries(baseHeaders).forEach(([key, value]) => {
                        const newKey = key.replace('X-Webhook', prefix);
                        headers[newKey] = value;
                    });
                }
            }
        } catch (error) {
            // Silently fail and use base headers to avoid breaking dispatch flow
            // But log internally if possible
        }

        return headers;
    }
}

export const dispatcherHeaders = DispatcherHeaders.getInstance();

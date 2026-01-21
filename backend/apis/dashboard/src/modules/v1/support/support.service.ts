import PQueue from 'p-queue';
import got from 'got';
import { logger } from '@kyrazo/shared';
import { CreateSupportTicketInput } from './support.schema';

export class SupportService {
    private queue: PQueue;
    private readonly webhookUrl =
        'https://n8n.kyrazo.com/webhook/25f4b0df-aa76-4488-8cb0-1a76951803c9';

    constructor() {
        this.queue = new PQueue({ concurrency: 5 }); // Throttle to 5 concurrent requests
    }

    async createTicket(
        input: CreateSupportTicketInput,
        userDetails: { email: string; name: string; workspace: string }
    ) {
        const payload = {
            ...input,
            ...userDetails,
            timestamp: new Date().toISOString(),
        };

        // Add to queue for reliable delivery
        return this.queue.add(async () => {
            try {
                logger.info(
                    `Sending support ticket to webhook for user: ${userDetails.email}`
                );
                await got.post(this.webhookUrl, {
                    json: payload,
                    retry: {
                        limit: 3,
                        methods: ['POST'], // Explicitly allow POST since it's not idempotent by default
                        statusCodes: [408, 413, 429, 500, 502, 503, 504],
                        backoffLimit: 3000, // Maximum delay between retries
                    },
                });

                logger.info(
                    `Support ticket sent successfully for user: ${userDetails.email}`
                );
            } catch (error) {
                logger.error(
                    'Failed to send support ticket to webhook:',
                    error as Error
                );
                // Depending on requirements, we might want to retry here or just log the failure.
                // PQueue doesn't handle retries automatically, but got/manual logic could.
                throw error;
            }
        });
    }
}

export const supportService = new SupportService();

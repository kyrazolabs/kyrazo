import { z } from 'zod';

export const webhookType = z.enum(
    ['publish', 'receive', 'forward'],
    'Invalid webhookType'
);


export type WebhookType = z.infer<typeof webhookType>
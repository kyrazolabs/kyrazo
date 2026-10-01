import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { logger } from '@kyrazo/shared';

export interface SQSSendOptions {
    queueUrl: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    messageAttributes?: Record<string, string>;
    messageGroupId?: string;
    messageDeduplicationId?: string;
}

export class SQSService {
    private static instance: SQSService;
    private constructor() {}

    public static getInstance(): SQSService {
        if (!SQSService.instance) {
            SQSService.instance = new SQSService();
        }
        return SQSService.instance;
    }

    /**
     * Sends a message to SQS using AWS SDK v3
     */
    public async send(
        body: string,
        options: SQSSendOptions
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            const client = new SQSClient({
                region: options.region,
                credentials: {
                    accessKeyId: options.accessKeyId,
                    secretAccessKey: options.secretAccessKey,
                },
            });

            // Prepare message attributes if provided
            const attributes: Record<string, any> = {};
            if (options.messageAttributes) {
                for (const [key, value] of Object.entries(options.messageAttributes)) {
                    attributes[key] = {
                        DataType: 'String',
                        StringValue: value,
                    };
                }
            }

            const command = new SendMessageCommand({
                QueueUrl: options.queueUrl,
                MessageBody: body,
                MessageAttributes: attributes,
                MessageGroupId: options.messageGroupId,
                MessageDeduplicationId: options.messageDeduplicationId,
            });

            const response = await client.send(command);

            logger.debug(`[SQSService] Successfully sent message to SQS: ${response.MessageId}`);
            return { success: true, messageId: response.MessageId };
        } catch (error: any) {
            logger.error(`[SQSService] Failed to send to SQS: ${error.message}`, {
                queueUrl: options.queueUrl,
            });
            return { success: false, error: error.message };
        }
    }
}

export const sqsService = SQSService.getInstance();

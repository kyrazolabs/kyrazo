import { sqsService } from '@/services/queues/sqs.service';
import { logger, unprefixId } from '@kyrazo/shared';

export class SQSTransport {
    private static instance: SQSTransport;
    private constructor() {}

    public static getInstance(): SQSTransport {
        if (!SQSTransport.instance) {
            SQSTransport.instance = new SQSTransport();
        }
        return SQSTransport.instance;
    }

    /**
     * Sends a single event to SQS
     */
    public async send(event: any, targetConfig: any): Promise<{ success: boolean; error?: string }> {
        try {
            const body = JSON.stringify(event);
            
            // Map Kyrazo metadata to SQS Attributes
            const attributes: Record<string, string> = {
                'Kyrazo-Event-Id': event.id,
                'Kyrazo-Event-Type': event.type,
                'Kyrazo-Workspace': event.workspaceId,
            };

            const isFifo = targetConfig.queueType === 'fifo';
            
            const result = await sqsService.send(body, {
                queueUrl: targetConfig.queueUrl,
                region: targetConfig.region,
                accessKeyId: targetConfig.accessKeyId,
                secretAccessKey: targetConfig.secretAccessKey,
                messageAttributes: attributes,
                // For FIFO queues, we must provide GroupId and DeduplicationId
                messageGroupId: isFifo ? unprefixId(event.workspaceId) : undefined,
                messageDeduplicationId: isFifo ? event.id : undefined,
            });

            return result;
        } catch (error: any) {
            logger.error(`[SQSTransport] Failed to dispatch to SQS: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}

export const sqsTransport = SQSTransport.getInstance();

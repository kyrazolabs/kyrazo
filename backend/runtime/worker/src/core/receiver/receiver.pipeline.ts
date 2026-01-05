import { logger } from "@kyrazo/shared";
import { receiverDetector } from "./receiver.detector";

export class ReceiverPipeline {
    private static instance: ReceiverPipeline;
    constructor() {}

    public static getInstance(): ReceiverPipeline {
        if (!ReceiverPipeline.instance) {
            ReceiverPipeline.instance = new ReceiverPipeline();
        }
        return ReceiverPipeline.instance;
    }

    public async process(event: any): Promise<void> {
        try {
            await receiverDetector.detect(event);

            logger.debug(`✅ Publish event processed: ${event.eventId}`);
        } catch (error) {
            logger.error("❌ Error processing publish event:", error as Error);
            throw error;
        }
    }
}

export const receiverPipeline = ReceiverPipeline.getInstance();

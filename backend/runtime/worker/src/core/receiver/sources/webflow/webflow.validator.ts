import type { IReceivedEvent } from '@/types/events/event.types';
import { logger } from '@kyrazo/shared';

export class WebflowValidator {
    private static instance: WebflowValidator;

    private constructor() {}

    public static getInstance(): WebflowValidator {
        if (!WebflowValidator.instance) {
            WebflowValidator.instance = new WebflowValidator();
        }
        return WebflowValidator.instance;
    }

    public validate(event: IReceivedEvent): boolean {
        const headers = event.headers;

        if (!headers['x-webflow-signature']) {
            logger.debug('[WebflowValidator] Missing x-webflow-signature header');
            return false;
        }

        if (!headers['x-webflow-timestamp']) {
            logger.debug('[WebflowValidator] Missing x-webflow-timestamp header');
            return false;
        }

        return true;
    }
}

export const webflowValidator = WebflowValidator.getInstance();

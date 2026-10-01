import type { IReceivedEvent } from '@/types/events/event.types';
import { logger } from '@kyrazo/shared';

export class SlackValidator {
    private static instance: SlackValidator;

    private constructor() {}

    public static getInstance(): SlackValidator {
        if (!SlackValidator.instance) {
            SlackValidator.instance = new SlackValidator();
        }
        return SlackValidator.instance;
    }

    public validate(event: IReceivedEvent): boolean {
        const headers = event.headers;

        if (!headers['x-slack-signature']) {
            logger.debug('[SlackValidator] Missing x-slack-signature header');
            return false;
        }

        if (!headers['x-slack-request-timestamp']) {
            logger.debug('[SlackValidator] Missing x-slack-request-timestamp header');
            return false;
        }

        return true;
    }
}

export const slackValidator = SlackValidator.getInstance();

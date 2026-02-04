import type { IReceivedEvent } from '@/types/events/event.types';
import { logger } from '@kyrazo/shared';

export class GitHubValidator {
    private static instance: GitHubValidator;

    private constructor() {}

    public static getInstance(): GitHubValidator {
        if (!GitHubValidator.instance) {
            GitHubValidator.instance = new GitHubValidator();
        }
        return GitHubValidator.instance;
    }

    public validate(event: IReceivedEvent): boolean {
        const headers = event.headers;

        if (!headers['x-github-event']) {
            logger.debug('[GitHubValidator] Missing X-GitHub-Event header');
            return false;
        }

        if (!headers['x-github-delivery']) {
            logger.debug('[GitHubValidator] Missing X-GitHub-Delivery header');
            return false;
        }

        // Signature is optional in some setups but we require it for security as per Kyrazo's pattern
        if (!headers['x-hub-signature-256']) {
            logger.debug('[GitHubValidator] Missing X-Hub-Signature-256 header');
            return false;
        }

        return true;
    }
}

export const githubValidator = GitHubValidator.getInstance();

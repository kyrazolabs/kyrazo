import crypto from 'crypto';
import { logger } from '@kyrazo/shared';

export class GitHubSignature {
    private static instance: GitHubSignature;

    private constructor() {}

    public static getInstance(): GitHubSignature {
        if (!GitHubSignature.instance) {
            GitHubSignature.instance = new GitHubSignature();
        }
        return GitHubSignature.instance;
    }

    /**
     * Verify GitHub signature using HMAC SHA256
     * @param rawBody The raw request body
     * @param signatureHeader The X-Hub-Signature-256 header (starts with sha256=)
     * @param secret The webhook signing secret
     */
    public verify(rawBody: string, signatureHeader: string, secret: string): boolean {
        try {
            if (!signatureHeader) {
                logger.warn('[GitHubSignature] Missing X-Hub-Signature-256 header');
                return false;
            }

            if (!signatureHeader.startsWith('sha256=')) {
                logger.warn('[GitHubSignature] Invalid signature format, expected sha256=');
                return false;
            }

            const signature = signatureHeader.slice(7); // Remove 'sha256='
            const hmac = crypto.createHmac('sha256', secret);
            const digest = hmac.update(rawBody).digest('hex');

            return crypto.timingSafeEqual(
                Buffer.from(signature, 'hex'),
                Buffer.from(digest, 'hex')
            );
        } catch (error: any) {
            logger.warn(`[GitHubSignature] Verification failed: ${error.message}`);
            return false;
        }
    }
}

export const githubSignature = GitHubSignature.getInstance();

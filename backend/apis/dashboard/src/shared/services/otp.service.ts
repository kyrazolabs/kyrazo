import { OTP } from 'otplib';
import * as QRCode from 'qrcode';
import { redisConfig } from '@/configs/redis';
import { config } from '@/configs/app';
import { logger, unprefixId } from '@kyrazo/shared';
import { mailQueues, mailQueuesName } from '@/producers/jobs/v1/publishers';

export class OTPService {
    private static readonly totpInstance = new OTP();
    private static readonly REDIS_PREFIX = 'otp:';
    private static readonly TEMP_2FA_PREFIX = 'otp:temp_2fa:';
    private static readonly RECENT_VERIFIED_PREFIX = 'otp:verified:';

    /**
     * Generate a TOTP secret and QR code for a user
     */
    static async generateTOTPSetup(userId: string, email: string) {
        // authenticator secrets are typically base32
        const secret = this.totpInstance.generateSecret();
        const otpauth = this.totpInstance.generateURI({
            issuer: config.app.name,
            label: email,
            secret,
        });
        const qrCode = await QRCode.toDataURL(otpauth);

        return { secret, qrCode };
    }

    /**
     * Verify a TOTP code
     */
    static async verifyTOTP(token: string, secret: string): Promise<boolean> {
        try {
            const result = await this.totpInstance.verify({ token, secret, epochTolerance: 30 });
            return result.valid;
        } catch (error) {
            logger.error('TOTP verification error', error as Error);
            return false;
        }
    }

    /**
     * Generate and store a temporary verification token for 2FA login flow
     */
    static async generateTemp2FAToken(userId: string): Promise<string> {
        const tempToken = crypto.randomUUID();
        const key = `${this.TEMP_2FA_PREFIX}${tempToken}`;
        // Store for 5 minutes
        await redisConfig.set(key, unprefixId(userId)!, 300);
        return tempToken;
    }

    /**
     * Get userId from temporary 2FA token
     */
    static async getUserIdFromTempToken(tempToken: string): Promise<string | null> {
        const key = `${this.TEMP_2FA_PREFIX}${tempToken}`;
        return await redisConfig.get(key);
    }

    /**
     * Invalidate temporary 2FA token
     */
    static async invalidateTempToken(tempToken: string): Promise<void> {
        const key = `${this.TEMP_2FA_PREFIX}${tempToken}`;
        await redisConfig.del(key);
    }

    /**
     * Generate and send an Email OTP
     */
    static async generateAndSendEmailOTP(
        userId: string,
        email: string,
        action: string
    ): Promise<string> {
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
        const key = `${this.REDIS_PREFIX}${action}:${unprefixId(userId)}`;

        // Store for 10 minutes
        await redisConfig.set(key, otp, 600);

        try {
            await mailQueues.sendMailHighPriorityQueue.waitUntilReady();
            await mailQueues.sendMailHighPriorityQueue.add(
                mailQueuesName.sendMailHighPriorityQueueName,
                {
                    to: email,
                    subject: `${config.app.name} - Verification Code`,
                    html: `<p>Your verification code is: <strong>${otp}</strong>. It will expire in 10 minutes.</p>`,
                }
            );
        } catch (error) {
            logger.error('Failed to send OTP email', error as Error);
            throw new Error('Failed to send verification email');
        }

        return otp;
    }

    /**
     * Verify an Email OTP
     */
    static async verifyEmailOTP(userId: string, action: string, otp: string): Promise<boolean> {
        const key = `${this.REDIS_PREFIX}${action}:${unprefixId(userId)}`;
        const storedOtp = await redisConfig.get(key);

        if (storedOtp === otp) {
            await redisConfig.del(key);
            return true;
        }
        return false;
    }

    /**
     * Mark an action as recently verified
     */
    static async markActionAsVerified(userId: string, action: string): Promise<void> {
        const key = `${this.RECENT_VERIFIED_PREFIX}${action}:${unprefixId(userId)}`;
        // Valid for 15 minutes
        await redisConfig.set(key, 'true', 900);
    }

    /**
     * Check if an action was recently verified
     */
    static async isActionRecentlyVerified(userId: string, action: string): Promise<boolean> {
        const key = `${this.RECENT_VERIFIED_PREFIX}${action}:${unprefixId(userId)}`;
        const verified = await redisConfig.get(key);
        return verified === 'true';
    }
}

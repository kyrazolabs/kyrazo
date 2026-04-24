import { OTP } from 'otplib';
import * as QRCode from 'qrcode';
import { redisConfig } from '@/configs/redis';
import { config } from '@/configs/app';
import { logger, unprefixId, RedisKeys } from '@kyrazo/shared';
import { mailQueues, mailQueuesName } from '@/producers/jobs/v1/publishers';

export class OTPService {
    private static readonly totpInstance = new OTP();

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
        } catch (error: any) {
            logger.error('TOTP verification error', error);
            return false;
        }
    }

    /**
     * Generate and store a temporary verification token for 2FA login flow
     */
    static async generateTemp2FAToken(userId: string): Promise<string> {
        const tempToken = crypto.randomUUID();
        const key = RedisKeys.auth.otpTemp2fa(tempToken);
        // Store for 5 minutes
        await redisConfig.set(key, unprefixId(userId)!, 300);
        return tempToken;
    }

    /**
     * Get userId from temporary 2FA token
     */
    static async getUserIdFromTempToken(tempToken: string): Promise<string | null> {
        const key = RedisKeys.auth.otpTemp2fa(tempToken);
        return await redisConfig.get(key);
    }

    /**
     * Invalidate temporary 2FA token
     */
    static async invalidateTempToken(tempToken: string): Promise<void> {
        const key = RedisKeys.auth.otpTemp2fa(tempToken);
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
        const key = RedisKeys.auth.otpEmail(action, userId);

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
        } catch (error: any) {
            logger.error('Failed to send OTP email', error);
            throw new Error('Failed to send verification email');
        }

        return otp;
    }

    /**
     * Verify an Email OTP
     */
    static async verifyEmailOTP(userId: string, action: string, otp: string): Promise<boolean> {
        const key = RedisKeys.auth.otpEmail(action, userId);
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
        const key = RedisKeys.auth.otpVerified(action, userId);
        // Valid for 15 minutes
        await redisConfig.set(key, 'true', 900);
    }

    /**
     * Check if an action was recently verified
     */
    static async isActionRecentlyVerified(userId: string, action: string): Promise<boolean> {
        const key = RedisKeys.auth.otpVerified(action, userId);
        const verified = await redisConfig.get(key);
        return verified === 'true';
    }
}

import jwt from 'jsonwebtoken';
import { config } from '@/configs';
import { logger, RefreshToken } from '@kyrazo/shared';

export interface JWTPayload {
    userId: string;
    email: string;
    type?: string; // 'password_reset', 'email_verification', etc.
    ip?: string;
    iat?: number;
    exp?: number;
    aud?: string;
    iss?: string;
    nbf?: number;
    jti?: string;
    sub?: string;
}

interface TokenPair {
    access: string;
    refresh: string;
}

export class AuthJWT {
    private static instance: AuthJWT;

    constructor() {}

    public static getInstance(): AuthJWT {
        if (!AuthJWT.instance) {
            AuthJWT.instance = new AuthJWT();
        }
        return AuthJWT.instance;
    }

    /**
     * @title Generate Authorization Tokens
     * @param {JWTPayload} payload - The payload to encode in the tokens.
     * @returns {TokenPair} The access and refresh tokens.
     */
    public generateTokenPair(payload: JWTPayload): TokenPair {
        const access = jwt.sign(payload, config.jwt.secrets.access, {
            expiresIn: config.jwt.expires.access,
            issuer: config.app.name,
            audience: config.app.url,
        } as jwt.SignOptions);

        const refresh = jwt.sign(payload, config.jwt.secrets.refresh, {
            expiresIn: config.jwt.expires.refresh,
            issuer: config.app.name,
            audience: config.app.url,
        } as jwt.SignOptions);
        return { access, refresh };
    }

    /**
     * Alias for generateTokenPair
     */
    public async generateTokens(payload: JWTPayload): Promise<TokenPair> {
        return this.generateTokenPair(payload);
    }

    /**
     * Store refresh token in database
     */
    public async storeRefreshToken(userId: string, token: string): Promise<void> {
        try {
            await RefreshToken.create({
                userId,
                token,
                expiresAt:
                    this.getTokenExpiration(token) ||
                    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });
        } catch (error: any) {
            logger.error('Error storing refresh token', error);
            throw error;
        }
    }

    /**
     * @title Generate Password Reset Token
     * @param {string} userId - The user ID.
     * @param {string} email - The user's email address.
     * @returns {string} The signed JWT reset token.
     */
    public generateResetToken(payload: { userId: string; email: string }): string {
        return jwt.sign(
            {
                userId: payload.userId,
                email: payload.email,
                type: 'password_reset',
            },
            config.jwt.secrets.key,
            {
                expiresIn: config.jwt.expires.reset,
                issuer: config.app.name,
                audience: config.app.url,
            } as jwt.SignOptions
        );
    }

    /**
     * @title Generate Email Verification Token
     * @param {string} userId - The user ID.
     * @param {string} email - The user's email address.
     * @returns {string} The signed JWT verification token.
     */
    public generateVerificationToken(email: string): string {
        return jwt.sign({ email, type: 'email_verification' }, config.jwt.secrets.key, {
            expiresIn: config.jwt.expires.verification,
            issuer: config.app.name,
            audience: config.app.url,
        } as jwt.SignOptions);
    }

    /**
     * @title Verify Access Token
     * @description Verifies a JWT access token and returns the decoded payload.
     * @param {string} token - The JWT access token to verify.
     * @returns {JWTPayload} The decoded payload.
     * @throws {Error} If the token is invalid.
     */
    public verifyAccessToken(
        token: string
    ): { valid: true; payload: JWTPayload } | { valid: false; reason: 'expired' | 'invalid' } {
        try {
            const decoded = jwt.verify(token, config.jwt.secrets.access, {
                issuer: config.app.name,
                audience: config.app.url,
            }) as JWTPayload;
            return { valid: true, payload: decoded };
        } catch (error: any) {
            if (error?.name === 'TokenExpiredError') {
                return { valid: false, reason: 'expired' };
            }
            logger.error('Invalid access token', error);
            return { valid: false, reason: 'invalid' };
        }
    }

    /**
     * @title Verify Refresh Token
     * @description Verifies a JWT refresh token and returns the decoded payload.
     * @param {string} token - The JWT refresh token to verify.
     * @returns {JWTPayload} The decoded payload.
     * @throws {Error} If the token is invalid.
     */
    public verifyRefreshToken(token: string): JWTPayload {
        try {
            return jwt.verify(token, config.jwt.secrets.refresh) as JWTPayload;
        } catch (error: any) {
            logger.error('Refresh token verify error', error);
            throw new Error('Invalid refresh token');
        }
    }

    /**
     * @title Verify Reset Token
     * @description Verifies a JWT reset token and returns the decoded payload.
     * @param {string} token - The JWT reset token to verify.
     * @returns {{ userId: string; email: string; type: string }} The decoded payload.
     * @throws {Error} If the token is invalid or expired.
     */
    public verifyResetToken(token: string): {
        userId: string;
        email: string;
        type: string;
    } {
        try {
            return jwt.verify(token, config.jwt.secrets.key, {
                issuer: config.app.name,
                audience: config.app.url,
            }) as { userId: string; email: string; type: string };
        } catch (error: any) {
            logger.error('Reset token verify error', error);
            throw new Error('Invalid or expired reset token');
        }
    }

    /**
     * @title Verify Verification Token
     * @description Verifies a JWT email verification token and returns the decoded payload.
     * @param {string} token - The JWT verification token to verify.
     * @returns {{ userId: string; email: string; type: string }} The decoded payload.
     * @throws {Error} If the token is invalid or expired.
     * @example
     * const payload = JWTService.verifyVerificationToken(token);
     */
    public verifyVerificationToken(token: string): {
        userId: string;
        email: string;
        type: string;
    } {
        try {
            return jwt.verify(token, config.jwt.secrets.key, {
                issuer: config.app.name,
                audience: config.app.url,
            }) as { userId: string; email: string; type: string };
        } catch (error: any) {
            logger.error('Verification token verify error', error);
            throw new Error('Invalid or expired verification token');
        }
    }

    /**
     * @title Get Token Expiration
     * @description Gets the expiration date of a JWT token.
     * @param {string} token - The JWT token.
     * @returns {Date | null} The expiration date, or null if not present.
     */
    public getTokenExpiration(token: string): Date | null {
        try {
            const decoded = jwt.decode(token) as any;
            if (decoded && decoded.exp) {
                return new Date(decoded.exp * 1000);
            }
            return null;
        } catch (error: any) {
            logger.error('Get Token Expiration Error', error);
            return null;
        }
    }

    /**
     * @title Is Token Expired
     * @description Checks if a JWT token is expired.
     * @param {string} token - The JWT token.
     * @returns {boolean} True if expired, false otherwise.
     * @example
     * const expired = JWTService.isTokenExpired(token);
     */
    public isTokenExpired(token: string): boolean {
        const expiration = this.getTokenExpiration(token);
        if (!expiration) return true;
        return expiration < new Date();
    }

    /**
     * Generate 2FA token
     */
    public generate2FAToken(userId: string, secret: string): string {
        return jwt.sign({ userId, secret, type: '2fa' }, config.jwt.secrets.key, {
            expiresIn: '5m', // Short expiry for 2FA
            issuer: config.app.name,
            audience: config.app.url,
        });
    }

    /**
     * Verify 2FA token
     */
    public verify2FAToken(token: string): {
        userId: string;
        secret: string;
        type: string;
    } {
        try {
            return jwt.verify(token, config.jwt.secrets.key, {
                issuer: config.app.name,
                audience: config.app.url,
            }) as { userId: string; secret: string; type: string };
        } catch (error: any) {
            logger.error('2FA token verify error', error);
            throw new Error('Invalid or expired 2FA token');
        }
    }
}

export const authUtils = AuthJWT.getInstance();

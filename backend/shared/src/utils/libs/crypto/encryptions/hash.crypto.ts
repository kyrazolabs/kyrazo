import crypto from 'crypto';
import { config } from '../../../../configs';

export class HasherCrypto {
    private static instance: HasherCrypto;

    private key = Buffer.from(config.security.encryptions.key!, 'hex');
    private ivLength = 12; // 96-bit IV for GCM

    constructor() {}

    public static getInstance(): HasherCrypto {
        if (!HasherCrypto.instance) {
            HasherCrypto.instance = new HasherCrypto();
        }
        return HasherCrypto.instance;
    }

    public encrypt(text: string): string {
        const iv = crypto.randomBytes(this.ivLength);

        const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
        const encrypted = Buffer.concat([
            cipher.update(text, 'utf8'),
            cipher.final(),
        ]);
        const tag = cipher.getAuthTag();

        // Combine IV + TAG + ENCRYPTED
        return Buffer.concat([iv, tag, encrypted]).toString('base64');
    }

    public decrypt(data: string): string {
        const raw = Buffer.from(data, 'base64');

        const iv = raw.subarray(0, this.ivLength);
        const tag = raw.subarray(this.ivLength, this.ivLength + 16);
        const encrypted = raw.subarray(this.ivLength + 16);

        const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
        decipher.setAuthTag(tag);

        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final(),
        ]);

        return decrypted.toString('utf8');
    }
}

export const hasherCrypto = HasherCrypto.getInstance();

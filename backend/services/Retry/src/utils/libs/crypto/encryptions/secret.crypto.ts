import { config, logger } from '@/configs';
import {
    createCipheriv,
    createDecipheriv,
    randomBytes,
    CipherGCMTypes,
} from 'crypto';

interface IGenerateOptions {
    length?: number;
    prefix?: string;
    version?: string;
    encoding?: 'base64url' | 'hex';
}

export class SecretCrypto {
    private static instance: SecretCrypto;
    private ALGORITHM: CipherGCMTypes = 'aes-256-gcm';
    private IV_LENGTH: number = 16; // For GCM, the IV is typically 12 or 16 bytes
    private AUTH_TAG_LENGTH: number = 16;

    constructor() {}

    public static getInstance(): SecretCrypto {
        if (!SecretCrypto.instance) {
            SecretCrypto.instance = new SecretCrypto();
        }
        return SecretCrypto.instance;
    }

    /**
     * @title Encrypts a secret key using AES-256-GCM.
     * @param secret - The plain text secret to encrypt.
     * @returns An object containing the encrypted secret and the initialization vector (iv).
     */
    public encrypt(secret: string): {
        encryptedSecret: string;
        iv: string;
    } {
        const iv = randomBytes(this.IV_LENGTH);
        const cipher = createCipheriv(
            this.ALGORITHM,
            Buffer.from(config.database.encKey),
            iv
        );

        const encrypted = Buffer.concat([
            cipher.update(secret, 'utf8'),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();

        const encryptedSecret = Buffer.concat([encrypted, authTag]).toString(
            'hex'
        );

        return {
            encryptedSecret,
            iv: iv.toString('hex'),
        };
    }

    /**
     * @title Decrypts an encrypted secret key.
     * @param secret - The hex-encoded encrypted secret (including auth tag).
     * @param iv - The hex-encoded initialization vector.
     * @returns The decrypted plain text secret.
     */
    public decrypt(secret: string, iv: string): string {
        const decipher = createDecipheriv(
            this.ALGORITHM,
            Buffer.from(config.database.encKey),
            Buffer.from(iv, 'hex')
        );
        const encryptedBuffer = Buffer.from(secret, 'hex');

        const authTag = encryptedBuffer.slice(-this.AUTH_TAG_LENGTH);
        const encryptedData = encryptedBuffer.slice(0, -this.AUTH_TAG_LENGTH);

        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([
            decipher.update(encryptedData),
            decipher.final(),
        ]);

        return decrypted.toString('utf8');
    }

    /**
     * @title Generates an advanced, structured, and cryptographically secure webhook secret.
     * @description The structure is: [prefix]_[version]_[timestamp]_[random_bytes].
     * @param options - Configuration options for generating the secret (length, prefix, version, encoding).
     * @returns A secure and structured webhook secret string.
     */
    public generateWebhookSecret(options: IGenerateOptions = {}): string {
        const {
            length = 32, // 256 bits of entropy, extremely strong
            prefix = 'websec',
            version = 'v1',
            encoding = 'base64url',
        } = options;

        if (length < 24) {
            logger.warn(
                `Warning: Secret length is ${length} bytes. A length of 24 bytes or more is strongly recommended for robust security.`
            );
        }

        const randomPart = randomBytes(length).toString(encoding);

        const timestampBuffer = Buffer.alloc(8); // 64-bit integer for timestamp
        timestampBuffer.writeBigInt64BE(BigInt(Date.now()));
        const timestampPart = timestampBuffer.toString(encoding);

        const secret = `${prefix}_${version}_${timestampPart}_${randomPart}`;

        return secret.replace(/=/g, '');
    }
}

export const secretCrypto = SecretCrypto.getInstance();

import { config, logger } from '@/configs';
import {
    createCipheriv,
    createDecipheriv,
    randomBytes,
    type CipherGCMTypes,
    hkdfSync,
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
    private KEY_LENGTH: number = 32;

    constructor() {}

    public static getInstance(): SecretCrypto {
        if (!SecretCrypto.instance) {
            SecretCrypto.instance = new SecretCrypto();
        }
        return SecretCrypto.instance;
    }

    /**
     * Derives a Project Key from the Master Key using HKDF
     */
    private deriveProjectKey(projectId: string): Buffer {
        if (
            !config.security.encryptions.key ||
            config.security.encryptions.key.length !== 32
        ) {
            throw new Error(
                'ENCRYPTION_KEY environment variable must be set and be 32 characters long.'
            );
        }
        return Buffer.from(
            hkdfSync(
                'sha256',
                Buffer.from(config.security.encryptions.key),
                Buffer.from('kyrazo-project-key'),
                Buffer.from(projectId),
                this.KEY_LENGTH
            )
        );
    }

    /**
     * @title Encrypts a secret key using AES-256-GCM.
     * @param secret - The plain text secret to encrypt.
     * @returns An object containing the encrypted secret and the initialization vector (iv).
     */
    public encrypt(
        projectId: string,
        plaintext: string
    ): {
        encrypted: string;
        iv: string;
    } {
        const key = this.deriveProjectKey(projectId);
        const iv = randomBytes(this.IV_LENGTH);
        const cipher = createCipheriv(this.ALGORITHM, key, iv);

        const encrypted = Buffer.concat([
            cipher.update(plaintext, 'utf8'),
            cipher.final(),
        ]);

        const authTag = cipher.getAuthTag();

        return {
            encrypted: Buffer.concat([encrypted, authTag]).toString('base64'),
            iv: iv.toString('base64'),
        };
    }

    /**
     * @title Decrypts an encrypted secret key.
     * @param encrypted - The hex-encoded encrypted secret (including auth tag).
     * @param iv - The hex-encoded initialization vector.
     * @returns The decrypted plain text secret.
     */
    public decrypt(encrypted: string, iv: string, projectId: string): string {
        const key = this.deriveProjectKey(projectId);

        const buffer = Buffer.from(encrypted, 'base64');
        const authTag = buffer.slice(-this.AUTH_TAG_LENGTH);
        const data = buffer.slice(0, -this.AUTH_TAG_LENGTH);

        const decipher = createDecipheriv(
            this.ALGORITHM,
            key,
            Buffer.from(iv, 'base64')
        );

        // Separate AuthTag from encrypted data
        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([
            decipher.update(data),
            decipher.final(),
        ]);

        return decrypted.toString('utf8');
    }

    /**
     * @title Generates an advanced, structured, and cryptographically secure source secret.
     * @description The structure is: [prefix]_[version]_[timestamp]_[random_bytes].
     * @param options - Configuration options for generating the secret (length, prefix, version, encoding).
     * @returns A secure and structured source secret string.
     */
    public generateSourceSecret(options: IGenerateOptions = {}): string {
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

    /**
     * @title Hashing (one-way) a given string.
     * @param data - The string to hash.
     * @param projectId - The project ID to derive the key from.
     * @returns The hashed string.
     */
    public hash(data: string, projectId: string): string {
        const key = this.deriveProjectKey(projectId);
        const hasher = new Bun.CryptoHasher('sha256', key);
        hasher.update(data);
        return hasher.digest('hex');
    }
}

export const secretCrypto = SecretCrypto.getInstance();

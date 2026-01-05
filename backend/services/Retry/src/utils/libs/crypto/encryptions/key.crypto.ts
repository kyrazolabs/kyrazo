import { config } from '@/configs/app';
import {
    createCipheriv,
    createDecipheriv,
    createHmac,
    pbkdf2Sync,
    randomBytes,
    timingSafeEqual,
} from 'crypto';
import { base62Encode, base62Decode } from '@/utils/helpers';
import { logger } from '@/configs';

type GenerateOpts = {
    prefix?: string;
    version?: string;
    entropyBytes?: number; // random part length in bytes
    pbkdf2Rounds?: number;
    hkdfInfo?: string;
};

type VerifyResult =
    | {
          valid: true;
          parts: {
              prefix: string;
              version: string;
              timestamp: number;
              randomHex: string;
              rawSecretHex: string;
          };
      }
    | { valid: false; reason: string };

export class KeyCrypto {
    private static instance: KeyCrypto;

    constructor() {}

    public static getInstance(): KeyCrypto {
        if (!KeyCrypto.instance) {
            KeyCrypto.instance = new KeyCrypto();
        }
        return KeyCrypto.instance;
    }

    /**
     * @title Generates an API Key using multi-layered algorithms:
     *  - Generates a random secret (entropy)
     *  - Derives sub-keys using PBKDF2 and HKDF
     *  - Encrypts the payload (timestamp + random + secret) with AES-256-GCM
     *  - Creates an HMAC-SHA512 over specific parts to ensure integrity and uniqueness
     *  - Returns a compact, encrypted key in base62 format with Prefix and Version information
     *
     * @param opts.masterKey - A secure master key from ENV. Required.
     * @param opts.prefix - A human-readable prefix. Default is "ak".
     * @param opts.version - The version of the key format. Default is "v2".
     * @param opts.entropyBytes - Number of random bytes (>=16). Default is 32.
     * @param opts.pbkdf2Rounds - PBKDF2 rounds to derive the AES key. Default is 100,000.
     * @param opts.hkdfInfo - Info parameter for HKDF to derive an additional HMAC key.
     *
     * @returns { object } { apiKey, metadata } where apiKey is the string to store and distribute.
     */

    public generateComplexApiKey(opts: GenerateOpts): {
        apiKey: string;
        metadata: { timestamp: number; rawSecretHex: string };
    } {
        try {
            const masterKey = config.security.encryptions.key;
            const {
                prefix = 'hs',
                version = 'v2',
                entropyBytes = 32,
                pbkdf2Rounds = 100_000,
                hkdfInfo = 'api-key-hkdf-v2',
            } = opts;

            if (!masterKey || typeof masterKey !== 'string') {
                logger.error(
                    'Missing or invalid masterKey in API key generation',
                    undefined,
                    { opts }
                );
                throw new Error('masterKey is required and must be a string.');
            }

            if (entropyBytes < 16) {
                logger.error('Entropy bytes too low', undefined, {
                    entropyBytes,
                });
                throw new Error('entropyBytes must be >= 16');
            }

            // 1) Generate raw random secret and timestamp
            const randomPart = randomBytes(entropyBytes); // entropy
            const timestamp = Math.floor(Date.now() / 1000); // seconds
            const timestampBuf = Buffer.allocUnsafe(8);
            timestampBuf.writeBigInt64BE(BigInt(timestamp));

            // 2) Derive keys: AES key via PBKDF2, HMAC key via HKDF
            const salt = randomBytes(16);
            const aesKey = pbkdf2Sync(
                masterKey,
                salt,
                pbkdf2Rounds,
                32,
                'sha512'
            ); // 32 bytes AES-256 key

            // HKDF (RFC 5869) simple using built-in -> implement with HMAC-SHA256 extract/expand
            const hkdfSalt = createHmac('sha256', salt)
                .update('hkdf-salt')
                .digest();
            const prk = createHmac('sha256', hkdfSalt)
                .update(masterKey)
                .digest();
            // expand: info | 1
            const infoBuf = Buffer.from(hkdfInfo);
            const t1 = createHmac('sha256', prk)
                .update(Buffer.concat([infoBuf, Buffer.from([0x01])]))
                .digest();
            const hmacKey = t1.slice(0, 32); // 32 bytes HMAC key

            // 3) Build plaintext payload: timestamp || random || salt || marker
            const marker = Buffer.from('AKV2'); // fixed marker helps detection
            const plaintext = Buffer.concat([
                timestampBuf,
                randomPart,
                salt,
                marker,
            ]);

            // 4) Encrypt with AES-256-GCM
            const iv = randomBytes(12); // 12 bytes is standard for GCM
            const cipher = createCipheriv('aes-256-gcm', aesKey, iv);
            const ciphertext = Buffer.concat([
                cipher.update(plaintext),
                cipher.final(),
            ]);
            const authTag = cipher.getAuthTag();

            // 5) Compute integrity HMAC over (version | iv | ciphertext | authTag)
            const macPayload = Buffer.concat([
                Buffer.from(version),
                iv,
                ciphertext,
                authTag,
            ]);
            const mac = createHmac('sha512', hmacKey)
                .update(macPayload)
                .digest(); // 64 bytes

            // 6) Compose token parts and encode compactly as base62
            // structure (binary): iv(12) | authTag(16) | salt(16) | ciphertext | mac(64)
            const composite = Buffer.concat([
                iv,
                authTag,
                salt,
                ciphertext,
                mac,
            ]);
            const encoded = base62Encode(composite);

            // Final textual key: PREFIX.VERSION.BASE62
            const apiKey = `${prefix}.${version}.${encoded}`;

            return {
                apiKey,
                metadata: {
                    timestamp,
                    rawSecretHex: randomPart.toString('hex'),
                },
            };
        } catch (err: unknown) {
            logger.error('Error generating complex API key', err as Error, {
                opts: {
                    prefix: opts.prefix,
                    version: opts.version,
                    entropyBytes: opts.entropyBytes,
                },
            });
            throw err; // rethrow to preserve function contract
        }
    }

    /**
     * @title Verifies an API Key generated by the complex algorithm above.
     *
     * @tutorial The process includes:
     *  - Decoding the textual key and splitting its components.
     *  - Re-deriving AES and HMAC keys using the same steps as generation (PBKDF2/HKDF).
     *  - Verifying the HMAC first to prevent unsafe decryption.
     *  - Decrypting AES-GCM and extracting the parts: timestamp, random, and salt.
     *  - Checking the marker and validating the length.
     *
     * @param apiKey - The textual key produced by generateComplexApiKey.
     * @param masterKey - The same masterKey used for generation.
     * @param toleranceSeconds - Allowed time tolerance for timestamp verification (default 30 days).
     *
     * @returns { VerifyResult } An object indicating the key validity and its components or the reason for failure.
     */

    public verifyComplexApiKey(
        apiKey: string,
        masterKey: string = config.security.encryptions.key!,
        toleranceSeconds = 30 * 24 * 3600
    ): VerifyResult {
        try {
            if (!apiKey || typeof apiKey !== 'string') {
                logger.error('Invalid API key format', undefined, {
                    apiKeySample: apiKey?.slice(0, 6),
                });
                return { valid: false, reason: 'invalid_key_format' };
            }

            const parts = apiKey.split('.');
            if (parts.length !== 3) {
                logger.error('Invalid API key structure', undefined, {
                    apiKeySample: apiKey?.slice(0, 6),
                });
                return { valid: false, reason: 'invalid_structure' };
            }

            const [prefix, version, encoded] = parts;
            if (!encoded) {
                logger.error('Empty API key payload', undefined, {
                    prefix,
                    version,
                });
                return { valid: false, reason: 'empty_payload' };
            }

            let composite: Buffer;
            try {
                composite = base62Decode(encoded);
            } catch (e: unknown) {
                logger.error('Failed to decode base62 API key', e as Error, {
                    encodedSample: encoded?.slice(0, 8),
                });
                return { valid: false, reason: 'base62_decode_failed' };
            }

            const iv = composite.slice(0, 12);
            const authTag = composite.slice(12, 28);
            const salt = composite.slice(28, 44);
            const mac = composite.slice(composite.length - 64);
            const ciphertext = composite.slice(44, composite.length - 64);

            const pbkdf2Rounds = 100_000;
            const aesKey = pbkdf2Sync(
                masterKey,
                salt,
                pbkdf2Rounds,
                32,
                'sha512'
            );

            const hkdfSalt = createHmac('sha256', salt)
                .update('hkdf-salt')
                .digest();
            const prk = createHmac('sha256', hkdfSalt)
                .update(masterKey)
                .digest();
            const infoBuf = Buffer.from(
                version === 'v2' ? 'api-key-hkdf-v2' : 'api-key-hkdf-v1'
            );
            const t1 = createHmac('sha256', prk)
                .update(Buffer.concat([infoBuf, Buffer.from([0x01])]))
                .digest();
            const hmacKey = t1.slice(0, 32);

            const macPayload = Buffer.concat([
                Buffer.from(version),
                iv,
                ciphertext,
                authTag,
            ]);
            const expectedMac = createHmac('sha512', hmacKey)
                .update(macPayload)
                .digest();

            if (
                expectedMac.length !== mac.length ||
                !timingSafeEqual(expectedMac, mac)
            ) {
                logger.error('MAC verification failed', undefined, {
                    version,
                    prefix,
                });
                return { valid: false, reason: 'mac_mismatch' };
            }

            const decipher = createDecipheriv('aes-256-gcm', aesKey, iv);
            decipher.setAuthTag(authTag);
            let plaintext: Buffer;
            try {
                plaintext = Buffer.concat([
                    decipher.update(ciphertext),
                    decipher.final(),
                ]);
            } catch (e: unknown) {
                logger.error(
                    'Decryption or authentication failed',
                    e as Error,
                    {
                        prefix,
                        version,
                    }
                );
                return {
                    valid: false,
                    reason: 'decryption_failed_or_auth_failed',
                };
            }

            if (plaintext.length < 8 + 8 + 4) {
                logger.error('Plaintext too short', undefined, {
                    length: plaintext.length,
                });
                return { valid: false, reason: 'plaintext_too_short' };
            }

            const timestamp = Number(plaintext.readBigInt64BE(0));
            const marker = Buffer.from('AKV2');
            if (
                !plaintext
                    .slice(plaintext.length - marker.length)
                    .equals(marker)
            ) {
                logger.error('Marker mismatch', undefined, { prefix, version });
                return { valid: false, reason: 'marker_mismatch' };
            }

            const randomPart = plaintext.slice(
                8,
                plaintext.length - marker.length - 16
            );
            const saltBack = plaintext.slice(
                plaintext.length - marker.length - 16,
                plaintext.length - marker.length
            );

            if (!saltBack.equals(salt)) {
                logger.error('Salt mismatch detected', undefined, {
                    prefix,
                    version,
                });
                return { valid: false, reason: 'salt_mismatch' };
            }

            const now = Math.floor(Date.now() / 1000);
            if (
                timestamp <= 0 ||
                Math.abs(now - timestamp) > toleranceSeconds
            ) {
                logger.error('Timestamp outside tolerance', undefined, {
                    timestamp,
                    now,
                    toleranceSeconds,
                });
                return { valid: false, reason: 'timestamp_out_of_tolerance' };
            }

            return {
                valid: true,
                parts: {
                    prefix,
                    version,
                    timestamp,
                    randomHex: randomPart.toString('hex'),
                    rawSecretHex: randomPart.toString('hex'),
                },
            };
        } catch (err: unknown) {
            logger.error(
                'Unexpected error in verifyComplexApiKey',
                err as Error
            );
            return { valid: false, reason: 'unknown_error' };
        }
    }
}

export const keyCrypto = KeyCrypto.getInstance();

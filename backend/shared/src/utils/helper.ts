import crypto from 'crypto';
import { logger } from '../configs';
import { secretCrypto } from './libs';
import { prefixId } from './id';
import type { ISource } from '../types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const ID_LENGTH = 26;

export function generateIngressId(userId: string): string {
    const timestamp = process.hrtime.bigint().toString();
    const input = `${userId}-${timestamp}`;

    const secretKey = 'SuperSecretKey123!'; // ممكن تخزنه في env
    const hash = crypto.createHmac('sha256', secretKey).update(input).digest();

    let result = '';
    for (let i = 0; i < ID_LENGTH; i++) {
        const index = hash[i] % ALPHABET.length;
        result += ALPHABET[index];
    }

    return result;
}

/**
 * @title Simple Base62 encode for buffers.
 * @param buf A string which wanted to encode
 */
export function base62Encode(buf: Buffer): string {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let num = BigInt('0x' + buf.toString('hex'));
    if (num === 0n) return '0';
    let out = '';
    while (num > 0n) {
        const rem = Number(num % 62n);
        out = alphabet[rem] + out;
        num = num / 62n;
    }
    return out;
}

/**
 * @title Simple Base62 decode to Buffer.
 * @param s An encoded string which wanted to decode
 */
export function base62Decode(s: string): Buffer {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let num = 0n;
    for (const ch of s) {
        const idx = BigInt(alphabet.indexOf(ch));
        if (idx < 0n) throw new Error('Invalid base62 char');
        num = num * 62n + idx;
    }
    let hex = num.toString(16);
    if (hex.length % 2) hex = '0' + hex;
    return Buffer.from(hex, 'hex');
}

const SAFE_MAP: Record<string, string> = {
    '/': '_s_',
    '?': '_q_',
    '&': '_a_',
    '=': '_e_',
    '#': '_h_',
    '%': '_p_',
    ':': '_c_',
};

export function safeEncode(input: string): string {
    return input.replace(/[/\?&#=%]/g, char => SAFE_MAP[char] || char);
}

export function safeDecode(input: string): string {
    let output = input;
    for (const [char, token] of Object.entries(SAFE_MAP)) {
        output = output.replaceAll(token, char);
    }
    return output;
}

/**
 * @title Decrypts source authentication secrets if they exist
 * @description Utility function to decrypt encrypted secrets in source authentication data
 * @param source - The source document to process
 * @param key - Optional custom key for decryption (default: prefixed namespaceId)
 * @returns A new source object with decrypted secrets and IVs removed for security
 */
export function decryptSourceSecrets(source: ISource, key?: string): ISource {
    if (!source || !source.authentication) return source;

    const decryptedSource = JSON.parse(JSON.stringify(source)); // Deep clone
    const prefixedKey =
        key || prefixId(source.namespaceId, 'namespace') || source.namespaceId.toString();
    const rawKey = source.namespaceId.toString();

    const decrypt = (encrypted: string, iv: string): string | undefined => {
        try {
            // Try with prefixed key (or custom key) first
            return secretCrypto.decrypt(encrypted, iv, prefixedKey);
        } catch (error: any) {
            try {
                // If it fails and we used the prefixed key, try fallback to raw key
                if (prefixedKey !== rawKey) {
                    return secretCrypto.decrypt(encrypted, iv, rawKey);
                }
            } catch (innerError) {
                // Ignore and proceed to fail
            }
            return undefined;
        }
    };

    // Decrypt service authentication secret and remove IV
    if (
        decryptedSource.authentication?.credentials?.secret &&
        decryptedSource.authentication?.credentials?.iv
    ) {
        const secret = decrypt(
            decryptedSource.authentication.credentials.secret,
            decryptedSource.authentication.credentials.iv
        );
        if (secret) {
            decryptedSource.authentication.credentials.secret = secret;
            delete decryptedSource.authentication.credentials.iv;
        }
    }

    // Decrypt HMAC signing secret and remove IV
    if (
        decryptedSource.authentication?.credentials?.signingSecret &&
        decryptedSource.authentication?.credentials?.iv
    ) {
        const secret = decrypt(
            decryptedSource.authentication.credentials.signingSecret,
            decryptedSource.authentication.credentials.iv
        );
        if (secret) {
            decryptedSource.authentication.credentials.signingSecret = secret;
            delete decryptedSource.authentication.credentials.iv;
        }
    }

    // Decrypt API key and remove IV
    if (
        decryptedSource.authentication?.credentials?.apiKey &&
        decryptedSource.authentication?.credentials?.iv
    ) {
        const secret = decrypt(
            decryptedSource.authentication.credentials.apiKey,
            decryptedSource.authentication.credentials.iv
        );
        if (secret) {
            decryptedSource.authentication.credentials.apiKey = secret;
            delete decryptedSource.authentication.credentials.iv;
        }
    }

    // Decrypt basic auth password and remove IV
    if (
        decryptedSource.authentication?.credentials?.password &&
        decryptedSource.authentication?.credentials?.iv
    ) {
        const secret = decrypt(
            decryptedSource.authentication.credentials.password,
            decryptedSource.authentication.credentials.iv
        );
        if (secret) {
            decryptedSource.authentication.credentials.password = secret;
            delete decryptedSource.authentication.credentials.iv;
        }
    }

    return decryptedSource;
}

/**
 * @title Map Map to Object
 * @description Converts a Map to a plain object for JSON serialization.
 * @param {Map<string, string>} map - The map to convert.
 * @returns {Record<string, string>} The converted object.
 */
export function mapToObject(map: Map<string, string>): Record<string, string> {
    const obj: Record<string, string> = {};
    map.forEach((value, key) => {
        obj[key] = value;
    });
    return obj;
}

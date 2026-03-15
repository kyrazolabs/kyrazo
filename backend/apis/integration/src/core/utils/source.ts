import { logger, secretCrypto, prefixId } from '@kyrazo/shared';
import type { ISource } from '@kyrazo/shared';

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
        } catch (error) {
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

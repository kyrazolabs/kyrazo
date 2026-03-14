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
    const namespaceKey =
        key || prefixId(source.namespaceId, 'namespace') || source.namespaceId.toString();

    // Decrypt service authentication secret and remove IV
    if (
        decryptedSource.authentication?.credentials?.secret &&
        decryptedSource.authentication?.credentials?.iv
    ) {
        try {
            decryptedSource.authentication.credentials.secret = secretCrypto.decrypt(
                decryptedSource.authentication.credentials.secret,
                decryptedSource.authentication.credentials.iv,
                namespaceKey
            );
            // Remove IV from response for security
            delete decryptedSource.authentication.credentials.iv;
        } catch (error) {
            logger.error('Failed to decrypt service secret:', error as Error);
            // Keep the encrypted version if decryption fails
        }
    }

    // Decrypt HMAC signing secret and remove IV
    if (
        decryptedSource.authentication?.credentials?.signingSecret &&
        decryptedSource.authentication?.credentials?.iv
    ) {
        try {
            decryptedSource.authentication.credentials.signingSecret = secretCrypto.decrypt(
                decryptedSource.authentication.credentials.signingSecret,
                decryptedSource.authentication.credentials.iv,
                namespaceKey
            );
            // Remove IV from response for security
            delete decryptedSource.authentication.credentials.iv;
        } catch (error) {
            logger.error('Failed to decrypt HMAC secret:', error as Error);
            // Keep the encrypted version if decryption fails
        }
    }

    // Decrypt API key and remove IV
    if (
        decryptedSource.authentication?.credentials?.apiKey &&
        decryptedSource.authentication?.credentials?.iv
    ) {
        try {
            decryptedSource.authentication.credentials.apiKey = secretCrypto.decrypt(
                decryptedSource.authentication.credentials.apiKey,
                decryptedSource.authentication.credentials.iv,
                namespaceKey
            );
            // Remove IV from response for security
            delete decryptedSource.authentication.credentials.iv;
        } catch (error) {
            logger.error('Failed to decrypt API key:', error as Error);
            // Keep the encrypted version if decryption fails
        }
    }

    // Decrypt basic auth password and remove IV
    if (
        decryptedSource.authentication?.credentials?.password &&
        decryptedSource.authentication?.credentials?.iv
    ) {
        try {
            decryptedSource.authentication.credentials.password = secretCrypto.decrypt(
                decryptedSource.authentication.credentials.password,
                decryptedSource.authentication.credentials.iv,
                namespaceKey
            );
            // Remove IV from response for security
            delete decryptedSource.authentication.credentials.iv;
        } catch (error) {
            logger.error('Failed to decrypt basic auth password:', error as Error);
            // Keep the encrypted version if decryption fails
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

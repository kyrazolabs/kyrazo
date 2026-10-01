
export interface ISecretParts {
    prefix: string;
    version: string;
    timestamp: Date;
    randomBytes: string;
    originalSecret: string;
}

export interface IGenerateOptions {
    /** The desired length of the random part in bytes. 32 bytes (256 bits) is highly recommended. */
    length?: number;
    /** A human-readable prefix for easy identification. */
    prefix?: string;
    /** The version of the secret format. */
    version?: string;
    /** The encoding for the random and timestamp parts. 'base64url' is recommended for web safety. */
    encoding?: 'base64url' | 'hex';
}
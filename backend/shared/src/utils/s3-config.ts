import { S3ClientConfig } from "@aws-sdk/client-s3";
import { S3Provider } from "../types/s3.types";

export interface S3ConfigInput {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
    forcePathStyle?: boolean;
}

/**
 * Builds an AWS SDK v3 S3ClientConfig based on the provider and input credentials.
 * Implements provider-specific defaults for forcePathStyle.
 */
export function buildS3Config(provider: S3Provider, input: S3ConfigInput): S3ClientConfig {
    const config: S3ClientConfig = {
        region: input.region,
        credentials: {
            accessKeyId: input.accessKeyId,
            secretAccessKey: input.secretAccessKey,
        },
        endpoint: input.endpoint || undefined,
        forcePathStyle: input.forcePathStyle,
    };

    // Provider-specific defaults
    switch (provider) {
        case 'minio':
            // MinIO usually requires path-style addressing
            if (config.forcePathStyle === undefined) {
                config.forcePathStyle = true;
            }
            break;
        case 'cloudflare':
        case 'backblaze':
            // R2 and B2 typically use virtual-host style, but can be overridden
            if (config.forcePathStyle === undefined) {
                config.forcePathStyle = false;
            }
            break;
    }

    return config;
}

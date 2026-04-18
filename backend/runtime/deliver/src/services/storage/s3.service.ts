import { S3Client } from 'bun';
import { logger } from '@kyrazo/shared';

export interface S3UploadOptions {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
}

export class S3Service {
    private static instance: S3Service;
    private constructor() {}

    public static getInstance(): S3Service {
        if (!S3Service.instance) {
            S3Service.instance = new S3Service();
        }
        return S3Service.instance;
    }

    /**
     * Uploads an object to S3 using Bun's native S3 client
     */
    public async upload(
        key: string,
        data: string | Uint8Array | Buffer,
        options: S3UploadOptions
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const client = new S3Client({
                accessKeyId: options.accessKeyId,
                secretAccessKey: options.secretAccessKey,
                bucket: options.bucket,
                region: options.region,
                endpoint: options.endpoint,
            });

            await client.write(key, data);
            
            logger.debug(`[S3Service] Successfully uploaded to s3://${options.bucket}/${key}`);
            return { success: true };
        } catch (error: any) {
            logger.error(`[S3Service] Failed to upload to S3: ${error.message}`, {
                bucket: options.bucket,
                key,
            });
            return { success: false, error: error.message };
        }
    }

    /**
     * Checks if a file exists in S3
     */
    public async exists(key: string, options: S3UploadOptions): Promise<boolean> {
        try {
            const client = new S3Client({
                accessKeyId: options.accessKeyId,
                secretAccessKey: options.secretAccessKey,
                bucket: options.bucket,
                region: options.region,
                endpoint: options.endpoint,
            });

            return await client.exists(key);
        } catch (error: any) {
            logger.error(`[S3Service] Failed to check exists in S3: ${error.message}`);
            return false;
        }
    }
}

export const s3Service = S3Service.getInstance();

import {
    S3Client,
    PutObjectCommand,
    HeadObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
    logger,
    secretCrypto,
    type IS3Bucket,
    type S3Provider,
    buildS3Config,
} from '@kyrazo/shared';

export interface S3UploadOptions {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
    provider: S3Provider;
    forcePathStyle?: boolean;
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
     * Maps an IS3Bucket mongoose document to S3UploadOptions.
     * Handles decryption of the secret access key.
     */
    public static fromBucket(bucket: IS3Bucket): S3UploadOptions {
        let secretAccessKey = bucket.secretAccessKey;

        // Decrypt if iv is present
        if (bucket.iv) {
            try {
                secretAccessKey = secretCrypto.decrypt(
                    bucket.namespaceId.toString(),
                    bucket.secretAccessKey,
                    bucket.iv
                );
            } catch (error: any) {
                logger.error(
                    `[S3Service] Failed to decrypt secretAccessKey for bucket ${bucket.id}: ${error.message}`
                );
                // Continue with original, might be already decrypted or fail later
            }
        }

        return {
            bucket: bucket.bucketName,
            region: bucket.region,
            accessKeyId: bucket.accessKeyId,
            secretAccessKey,
            endpoint: bucket.endpoint,
            provider: bucket.provider,
            forcePathStyle: bucket.forcePathStyle,
        };
    }

    /**
     * Internal factory for S3Client
     */
    protected getClient(options: S3UploadOptions): S3Client {
        const config = buildS3Config(options.provider, {
            region: options.region,
            accessKeyId: options.accessKeyId,
            secretAccessKey: options.secretAccessKey,
            endpoint: options.endpoint,
            forcePathStyle: options.forcePathStyle,
        });

        return new S3Client(config);
    }

    /**
     * Uploads an object to S3 using AWS SDK v3
     */
    public async upload(
        key: string,
        data: string | Uint8Array | Buffer,
        contentType: string,
        options: S3UploadOptions
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const client = this.getClient(options);
            const command = new PutObjectCommand({
                Bucket: options.bucket,
                Key: key,
                Body: data,
                ContentType: contentType,
            });

            await client.send(command);

            logger.debug(
                `[S3Service] Successfully uploaded to s3://${options.bucket}/${key} (${options.provider})`
            );
            return { success: true };
        } catch (error: any) {
            logger.error(`[S3Service] Failed to upload to S3: ${error.message}`, {
                bucket: options.bucket,
                key,
                provider: options.provider,
            });
            return { success: false, error: error.message };
        }
    }

    /**
     * Checks if a file exists in S3
     */
    public async exists(key: string, options: S3UploadOptions): Promise<boolean> {
        try {
            const client = this.getClient(options);
            const command = new HeadObjectCommand({
                Bucket: options.bucket,
                Key: key,
            });

            await client.send(command);
            return true;
        } catch (error: any) {
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                return false;
            }
            logger.error(`[S3Service] Failed to check exists in S3: ${error.message}`, {
                bucket: options.bucket,
                key,
            });
            return false;
        }
    }

    /**
     * Deletes an object from S3
     */
    public async delete(
        key: string,
        options: S3UploadOptions
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const client = this.getClient(options);
            const command = new DeleteObjectCommand({
                Bucket: options.bucket,
                Key: key,
            });

            await client.send(command);
            return { success: true };
        } catch (error: any) {
            logger.error(`[S3Service] Failed to delete from S3: ${error.message}`, {
                bucket: options.bucket,
                key,
            });
            return { success: false, error: error.message };
        }
    }

    /**
     * Generates a pre-signed URL for an S3 object
     */
    public async getPresignedUrl(
        key: string,
        options: S3UploadOptions,
        expiresIn: number = 3600
    ): Promise<string> {
        const client = this.getClient(options);
        const command = new HeadObjectCommand({
            Bucket: options.bucket,
            Key: key,
        });

        return await getSignedUrl(client, command, { expiresIn });
    }
}

export const s3Service = S3Service.getInstance();

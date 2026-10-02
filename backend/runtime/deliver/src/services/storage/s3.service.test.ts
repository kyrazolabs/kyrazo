import { describe, it, expect, mock, beforeEach, spyOn } from 'bun:test';
import { S3Service, type S3UploadOptions } from './s3.service';
import { PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

mock.module('@kyrazo/shared', () => ({
    logger: {
        debug: mock(() => {}),
        error: mock(() => {}),
    },
    secretCrypto: {
        decrypt: mock((ns, val, iv) => val), // Simple mock
    },
}));

describe('S3Service', () => {
    let s3Service: S3Service;
    const mockSend = mock(() => Promise.resolve({}));

    const defaultOptions: S3UploadOptions = {
        bucket: 'test-bucket',
        region: 'us-east-1',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
        provider: 'aws',
    };

    beforeEach(() => {
        s3Service = S3Service.getInstance();

        // Spy on the protected getClient method and return a mock client
        spyOn(s3Service as any, 'getClient').mockImplementation(() => ({
            send: mockSend,
        }));

        mockSend.mockClear();
    });

    it('should be a singleton', () => {
        const instance1 = S3Service.getInstance();
        const instance2 = S3Service.getInstance();
        expect(instance1).toBe(instance2);
    });

    it('should upload data successfully', async () => {
        const result = await s3Service.upload(
            'test.json',
            '{"foo":"bar"}',
            'application/json',
            defaultOptions
        );

        expect(result.success).toBe(true);
        expect(mockSend).toHaveBeenCalled();
        const command = mockSend.mock.calls[0][0];
        expect(command).toBeInstanceOf(PutObjectCommand);
        expect(command.input.Bucket).toBe('test-bucket');
        expect(command.input.Key).toBe('test.json');
        expect(command.input.Body).toBe('{"foo":"bar"}');
        expect(command.input.ContentType).toBe('application/json');
    });

    it('should return success: false when upload fails', async () => {
        mockSend.mockImplementationOnce(() => Promise.reject(new Error('Upload failed')));

        const result = await s3Service.upload('test.json', 'data', 'text/plain', defaultOptions);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Upload failed');
    });

    it('should check if file exists', async () => {
        const exists = await s3Service.exists('test.json', defaultOptions);

        expect(exists).toBe(true);
        expect(mockSend).toHaveBeenCalled();
        const command = mockSend.mock.calls[0][0];
        expect(command).toBeInstanceOf(HeadObjectCommand);
    });

    it('should return false when file does not exist', async () => {
        mockSend.mockImplementationOnce(() => Promise.reject({ name: 'NotFound' }));

        const exists = await s3Service.exists('missing.json', defaultOptions);

        expect(exists).toBe(false);
    });

    it('should delete file successfully', async () => {
        const result = await s3Service.delete('test.json', defaultOptions);

        expect(result.success).toBe(true);
        expect(mockSend).toHaveBeenCalled();
        const command = mockSend.mock.calls[0][0];
        expect(command).toBeInstanceOf(DeleteObjectCommand);
    });
});

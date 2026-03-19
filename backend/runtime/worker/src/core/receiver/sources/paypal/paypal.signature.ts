import crypto from 'crypto';
import { logger } from '@kyrazo/shared';

interface CertificateCache {
    [certUrl: string]: {
        certificate: string;
        expiresAt: number;
    };
}

export class PayPalSignature {
    private static instance: PayPalSignature;
    private certificateCache: CertificateCache = {};
    private readonly CERT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    constructor() {}

    public static getInstance(): PayPalSignature {
        if (!PayPalSignature.instance) {
            PayPalSignature.instance = new PayPalSignature();
        }
        return PayPalSignature.instance;
    }

    public async verify(
        rawBody: string,
        headers: Record<string, string>,
        webhookId: string
    ): Promise<boolean> {
        try {
            const transmissionId = headers['paypal-transmission-id'];
            const timeStamp = headers['paypal-transmission-time'];
            const certUrl = headers['paypal-cert-url'];
            const signature = headers['paypal-transmission-sig'];

            if (!transmissionId || !timeStamp || !certUrl || !signature) {
                logger.warn('Missing required PayPal signature headers');
                return false;
            }

            // Calculate CRC32 of raw body
            const crc = this.calculateCRC32(rawBody);

            // Create signed message
            const message = `${transmissionId}|${timeStamp}|${webhookId}|${crc}`;

            // Download and cache PayPal certificate
            const certPem = await this.downloadCertificate(certUrl);

            // Create signature buffer from base64
            const signatureBuffer = Buffer.from(signature, 'base64');

            // Verify signature using PayPal certificate
            const verifier = crypto.createVerify('SHA256');
            verifier.update(message);
            const isValid = verifier.verify(certPem, signatureBuffer);

            if (!isValid) {
                logger.warn('Invalid PayPal signature');
            }

            return isValid;
        } catch (error: any) {
            logger.error('Error verifying PayPal signature:', error);
            return false;
        }
    }
    private calculateCRC32(data: string): number {
        // Simple CRC32 implementation for webhook verification
        let crc = 0xffffffff;
        const buffer = Buffer.from(data);

        for (let i = 0; i < buffer.length; i++) {
            crc = crc ^ Number(buffer[i]);
            for (let j = 0; j < 8; j++) {
                crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
            }
        }

        return (crc ^ 0xffffffff) >>> 0;
    }

    /**
     * Download and cache PayPal certificate
     */
    private async downloadCertificate(certUrl: string): Promise<string> {
        try {
            // Check if certificate is cached and not expired
            const cached = this.certificateCache[certUrl];
            if (cached && cached.expiresAt > Date.now()) {
                logger.debug(`Using cached PayPal certificate for: ${certUrl}`);
                return cached.certificate;
            }

            logger.debug(`Downloading PayPal certificate from: ${certUrl}`);

            // Download certificate using HTTPS
            const https = await import('https');
            const certificate = await new Promise<string>((resolve, reject) => {
                const request = https.get(certUrl, (response: any) => {
                    let data = '';

                    response.on('data', (chunk: string) => {
                        data += chunk;
                    });

                    response.on('end', () => {
                        if (response.statusCode === 200) {
                            resolve(data);
                        } else {
                            reject(
                                new Error(`Failed to download certificate: ${response.statusCode}`)
                            );
                        }
                    });
                });

                request.on('error', (error: Error) => {
                    reject(error: any);
                });

                request.setTimeout(10000, () => {
                    request.destroy();
                    reject(new Error('Certificate download timeout'));
                });
            });

            // Cache the certificate for 24 hours
            this.certificateCache[certUrl] = {
                certificate,
                expiresAt: Date.now() + this.CERT_CACHE_TTL,
            };

            logger.debug(`Successfully downloaded and cached PayPal certificate`);
            return certificate;
        } catch (error: any) {
            logger.error('Error downloading PayPal certificate:', error);
            throw error;
        }
    }
}

export const paypalSignature = PayPalSignature.getInstance();

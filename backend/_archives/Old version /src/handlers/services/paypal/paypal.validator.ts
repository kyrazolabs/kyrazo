import crypto from 'crypto';
import { logger } from '@/utils';

// Certificate cache to avoid repeated downloads
interface CertificateCache {
  [certUrl: string]: {
    certificate: string;
    expiresAt: number;
  };
}

/**
 * @title PayPal Webhook Validator
 * @description Validates PayPal webhook signatures and event structure
 */
export class PayPalValidator {
   private static instance: PayPalValidator;
   private certificateCache: CertificateCache = {};
   private readonly CERT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

   private constructor() {}

  public static getInstance(): PayPalValidator {
    if (!PayPalValidator.instance) {
      PayPalValidator.instance = new PayPalValidator();
    }
    return PayPalValidator.instance;
  }

  /**
   * Verify PayPal webhook signature
   */
  public async verifySignature(
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
      logger.debug(`PayPal signed message: ${message}`);

      // Download and cache PayPal certificate
      const certPem = await this.downloadPayPalCertificate(certUrl);

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
    } catch (error) {
      logger.error('Error verifying PayPal signature:', error);
      return false;
    }
  }

  /**
   * Calculate CRC32 checksum of raw body
   */
  private calculateCRC32(data: string): number {
    // Simple CRC32 implementation for webhook verification
    let crc = 0xFFFFFFFF;
    const buffer = Buffer.from(data);

    for (let i = 0; i < buffer.length; i++) {
      crc = crc ^ buffer[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
      }
    }

    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  /**
   * Download and cache PayPal certificate
   */
  private async downloadPayPalCertificate(certUrl: string): Promise<string> {
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
      const certificate = await this.downloadCertificate(certUrl, https);

      // Cache the certificate for 24 hours
      this.certificateCache[certUrl] = {
        certificate,
        expiresAt: Date.now() + this.CERT_CACHE_TTL
      };

      logger.debug(`Successfully downloaded and cached PayPal certificate`);
      return certificate;
    } catch (error) {
      logger.error('Error downloading PayPal certificate:', error);
      throw error;
    }
  }

  /**
   * Download certificate from URL
   */
  private async downloadCertificate(url: string, https: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const request = https.get(url, (response: any) => {
        let data = '';

        response.on('data', (chunk: string) => {
          data += chunk;
        });

        response.on('end', () => {
          if (response.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`Failed to download certificate: ${response.statusCode}`));
          }
        });
      });

      request.on('error', (error: Error) => {
        reject(error);
      });

      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Certificate download timeout'));
      });
    });
  }

  /**
   * Validate PayPal event structure
   */
  public validateEventStructure(eventData: any): boolean {
    if (!eventData) {
      logger.warn('PayPal event data is null or undefined');
      return false;
    }

    if (!eventData.body) {
      logger.warn('PayPal event missing body');
      return false;
    }

    if (!eventData.body.id) {
      logger.warn('PayPal event body missing id');
      return false;
    }

    if (!eventData.body.event_type) {
      logger.warn('PayPal event body missing event_type');
      return false;
    }

    if (!eventData.body.resource) {
      logger.warn('PayPal event body missing resource');
      return false;
    }

    return true;
  }

  /**
   * Validate PayPal webhook configuration
   */
  public validateWebhookConfig(webhookConfig: any): boolean {
    if (!webhookConfig) {
      logger.warn('PayPal webhook config is null or undefined');
      return false;
    }

    if (!webhookConfig.webhookId) {
      logger.warn('PayPal webhook config missing webhookId');
      return false;
    }

    if (!webhookConfig.secret) {
      logger.warn('PayPal webhook config missing secret');
      return false;
    }

    return true;
  }
}

export const paypalValidator = PayPalValidator.getInstance();
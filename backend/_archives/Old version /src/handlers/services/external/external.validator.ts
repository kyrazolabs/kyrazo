import { logger } from '@/utils';
import { encryptionUtils } from '@/utils';
import crypto from 'crypto';

/**
 * @title External Event Validator
 * @description Validator for external/unsupported service events with proper authentication validation
 */
export class ExternalValidator {
  private static instance: ExternalValidator;

  private constructor() {}

  public static getInstance(): ExternalValidator {
    if (!ExternalValidator.instance) {
      ExternalValidator.instance = new ExternalValidator();
    }
    return ExternalValidator.instance;
  }

  /**
   * @title Validate event structure
   * @description Basic validation for general events - no signature verification required
   */
  public validateEventStructure(event: any): boolean {
    try {
      // Basic structure validation
      if (!event) {
        logger.warn('General validator: Event is null or undefined');
        return false;
      }

      if (!event.eventId) {
        logger.warn('General validator: Event missing eventId');
        return false;
      }

      // Different validation based on webhook type
      if (event.webhookType === 'receive') {
        // RECEIVE events need headers and body
        if (!event.headers) {
          logger.warn('General validator: Receive event missing headers');
          return false;
        }
        if (!event.body) {
          logger.warn('General validator: Receive event missing body');
          return false;
        }
      } else if (event.webhookType === 'publish') {
        // PUBLISH events need eventType and data
        if (!event.eventType) {
          logger.warn('General validator: Publish event missing eventType');
          return false;
        }
        if (!event.data) {
          logger.warn('General validator: Publish event missing data');
          return false;
        }
      } else if (event.webhookType === 'forward') {
        // FORWARD events should have targets or routeTo information
        if (!event.targets && !event.routeTo) {
          logger.warn('General validator: Forward event missing targets or routeTo');
          return false;
        }
      } else {
        // For unknown webhook types, just check for basic data
        if (!event.body && !event.data) {
          logger.warn('General validator: Event missing body or data');
          return false;
        }
      }

      logger.debug(`General validator: Event structure valid for ${event.eventId} (${event.webhookType})`);
      return true;
    } catch (error) {
      logger.error('General validator: Error validating event structure:', error);
      return false;
    }
  }

  /**
   * @title Validate HMAC signature using database configuration
   * @description Validates HMAC signature using algorithm, encoding, and signature header key from database
   */
  public validateHMACSignature(event: any, authConfig: any): boolean {
    try {
      const algorithm = authConfig.algorithm; // sha1, sha256, sha512, md5
      const encoding = authConfig.encoding; // base64, base64url, hex
      const signatureHeaderKey = authConfig.signatureHeaderKey; // May contain multiple headers separated by comma
      const signingSecret = authConfig.signingSecret;
      const iv = authConfig.iv;

      if (!algorithm || !encoding || !signatureHeaderKey || !signingSecret || !iv) {
        logger.warn('General validator: Missing HMAC configuration fields');
        return false;
      }

      // Decrypt the signing secret
      let decryptedSecret: string;
      try {
        decryptedSecret = encryptionUtils.decryptSecret(signingSecret, iv);
      } catch (error) {
        logger.error('General validator: Failed to decrypt signing secret:', error);
        return false;
      }

      // Get signature from headers (may be multiple headers)
      const headerKeys = signatureHeaderKey.split(',').map((key: string) => key.trim());
      let receivedSignature: string | null = null;

      for (const key of headerKeys) {
        if (event.headers[key.toLowerCase()]) {
          receivedSignature = event.headers[key.toLowerCase()];
          break;
        }
      }

      if (!receivedSignature) {
        logger.warn('General validator: No signature found in expected headers');
        return false;
      }

      // Create HMAC using specified algorithm
      const hmac = crypto.createHmac(algorithm, decryptedSecret);
      hmac.update(event.body, 'utf8');

      let expectedSignature: string;
      if (encoding === 'base64') {
        expectedSignature = hmac.digest('base64');
      } else if (encoding === 'base64url') {
        expectedSignature = hmac.digest('base64url');
      } else {
        expectedSignature = hmac.digest('hex');
      }

      // Compare signatures
      const isValid = crypto.timingSafeEqual(
        Buffer.from(receivedSignature, encoding === 'hex' ? 'hex' : 'base64'),
        Buffer.from(expectedSignature, encoding === 'hex' ? 'hex' : 'base64')
      );

      logger.debug(`General validator: HMAC validation ${isValid ? 'passed' : 'failed'} for event ${event.eventId}`);
      return isValid;

    } catch (error) {
      logger.error('General validator: Error validating HMAC signature:', error);
      return false;
    }
  }

  /**
   * @title Validate API Key authentication
   */
  public validateApiKey(event: any, authConfig: any): boolean {
    try {
      const headerKey = authConfig.headerKey;
      const expectedApiKey = authConfig.apiKey;
      const iv = authConfig.iv;

      if (!headerKey || !expectedApiKey || !iv) {
        logger.warn('General validator: Missing API key configuration fields');
        return false;
      }

      // Decrypt the expected API key
      let decryptedApiKey: string;
      try {
        decryptedApiKey = encryptionUtils.decryptSecret(expectedApiKey, iv);
      } catch (error) {
        logger.error('General validator: Failed to decrypt API key:', error);
        return false;
      }

      // Get API key from headers
      const receivedApiKey = event.headers[headerKey.toLowerCase()];

      if (!receivedApiKey) {
        logger.warn('General validator: No API key found in expected header');
        return false;
      }

      const isValid = receivedApiKey === decryptedApiKey;
      logger.debug(`General validator: API key validation ${isValid ? 'passed' : 'failed'} for event ${event.eventId}`);
      return isValid;

    } catch (error) {
      logger.error('General validator: Error validating API key:', error);
      return false;
    }
  }

  /**
   * @title Validate Basic Authentication
   */
  public validateBasicAuth(event: any, authConfig: any): boolean {
    try {
      const username = authConfig.username;
      const password = authConfig.password;
      const iv = authConfig.iv;

      if (!username || !password || !iv) {
        logger.warn('General validator: Missing basic auth configuration fields');
        return false;
      }

      // Decrypt the credentials
      let decryptedUsername: string;
      let decryptedPassword: string;
      try {
        decryptedUsername = encryptionUtils.decryptSecret(username, iv);
        decryptedPassword = encryptionUtils.decryptSecret(password, iv);
      } catch (error) {
        logger.error('General validator: Failed to decrypt basic auth credentials:', error);
        return false;
      }

      // Get authorization header
      const authHeader = event.headers['authorization'];

      if (!authHeader || !authHeader.startsWith('Basic ')) {
        logger.warn('General validator: No valid Basic auth header found');
        return false;
      }

      // Decode the base64 credentials
      const base64Credentials = authHeader.substring(6);
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
      const [receivedUsername, receivedPassword] = credentials.split(':');

      if (!receivedUsername || !receivedPassword) {
        logger.warn('General validator: Invalid basic auth credentials format');
        return false;
      }

      const isValid = receivedUsername === decryptedUsername && receivedPassword === decryptedPassword;
      logger.debug(`General validator: Basic auth validation ${isValid ? 'passed' : 'failed'} for event ${event.eventId}`);
      return isValid;

    } catch (error) {
      logger.error('General validator: Error validating basic auth:', error);
      return false;
    }
  }

  /**
   * @title Validate webhook exists (basic check)
   * @description Basic webhook validation for general events
   */
  public validateWebhook(webhook: any): boolean {
    if (!webhook) {
      logger.warn('General validator: Webhook not found');
      return false;
    }

    if (!webhook.isEnabled) {
      logger.warn('General validator: Webhook is disabled');
      return false;
    }

    if (webhook.status !== 'active') {
      logger.warn('General validator: Webhook is not active');
      return false;
    }

    return true;
  }
}

export const externalValidator = ExternalValidator.getInstance();
import crypto, { createCipheriv, createDecipheriv, randomBytes } from "crypto";

import { config } from "@/config";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // For GCM, the IV is typically 12 or 16 bytes
const AUTH_TAG_LENGTH = 16;

if (!config.encryptions.key || config.encryptions.key.length !== 32) {
  throw new Error(
    "ENCRYPTION_KEY environment variable must be set and be 32 characters long."
  );
}

export class EncryptionUtils {
  private static instance: EncryptionUtils;

  private constructor() {}

  public static getInstance(): EncryptionUtils {
    if (!EncryptionUtils.instance) {
      EncryptionUtils.instance = new EncryptionUtils();
    }
    return EncryptionUtils.instance;
  }

  /**
   * @title Encrypts a secret key using AES-256-GCM.
   * @param secret - The plain text secret to encrypt.
   * @returns An object containing the encrypted secret and the initialization vector (iv).
   */
  public encryptSecret(secret: string): {
    encryptedSecret: string;
    iv: string;
  } {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(
      ALGORITHM,
      Buffer.from(config.encryptions.key),
      iv
    );

    const encrypted = Buffer.concat([
      cipher.update(secret, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Integrating AuthTag with encrypted data to facilitate storage
    const encryptedSecret = Buffer.concat([encrypted, authTag]).toString("hex");

    return {
      encryptedSecret,
      iv: iv.toString("hex"),
    };
  }

  /**
   * @title Decrypts an encrypted secret key.
   * @param encryptedSecret - The hex-encoded encrypted secret (including auth tag).
   * @param iv - The hex-encoded initialization vector.
   * @returns The decrypted plain text secret.
   */
  public decryptSecret(encryptedSecret: string, iv: string): string {
    const decipher = createDecipheriv(
      ALGORITHM,
      Buffer.from(config.encryptions.key),
      Buffer.from(iv, "hex")
    );
    const encryptedBuffer = Buffer.from(encryptedSecret, "hex");

    // Separate AuthTag from encrypted data
    const authTag = encryptedBuffer.slice(-AUTH_TAG_LENGTH);
    const encryptedData = encryptedBuffer.slice(0, -AUTH_TAG_LENGTH);

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);


    return decrypted.toString("utf8");
  }

  /**
   * @title Generates an HMAC signature for a webhook payload using SHA-256.
   * @param payload - The payload to sign.
   * @param secret - The shared secret key for generating the signature.
   * @returns The hex-encoded HMAC signature string.
   */
  public generateHMACSignature(payload: string, secret: string): string {
    return crypto
      .createHmac("sha256", secret)
      .update(payload, "utf8")
      .digest("hex");
  }

  /**
   * @title Generates a webhook signature header value in the format: "t=<timestamp>,v1=<signature>".
   * @param payload - The webhook payload string.
   * @param secret - The secret key used to generate the signature.
   * @param timestamp - The UNIX timestamp in seconds used in the signature.
   * @returns The formatted webhook signature header string.
   */
  public generateWebhookSignature(
    payload: string,
    secret: string,
    timestamp: number
  ): string {
    const signedPayload = `${timestamp}.${payload}`;
    const signature = this.generateHMACSignature(signedPayload, secret);
    return `t=${timestamp},v1=${signature}`;
  }

  /**
   * @title Verifies the validity of a webhook signature.
   * @param payload - The webhook payload string.
   * @param signature - The signature header value to verify (format: "t=...,v1=...").
   * @param secret - The secret key used to compute the expected signature.
   * @param tolerance - Maximum allowed difference (in seconds) between provided timestamp and current time. Default is 300s.
   * @returns True if the signature is valid and within the allowed tolerance, false otherwise.
   */
  public verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
    tolerance: number = 300 // 5 minutes
  ): boolean {
    try {
      const elements = signature.split(",");
      const timestampElement = elements.find((el) => el.startsWith("t="));
      const signatureElement = elements.find((el) => el.startsWith("v1="));

      if (!timestampElement || !signatureElement) {
        return false;
      }

      const timestamp = parseInt(timestampElement.split("=")[1]);
      const expectedSignature = signatureElement.split("=")[1];

      // Check timestamp tolerance
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - timestamp) > tolerance) {
        return false;
      }

      // Verify signature
      const signedPayload = `${timestamp}.${payload}`;
      const computedSignature = this.generateHMACSignature(
        signedPayload,
        secret
      );

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(computedSignature, "hex")
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * @title Signs a message payload with HMAC-SHA512 and timestamp
   * @description Generates a base64 signature over the message, timestamp, and nonce.
   * @param {string} message - The raw message to sign (JSON string recommended).
   * @param {string} secret - The shared master secret (from ENV).
   * @param {number} [timestamp] - Optional timestamp (ms). Defaults to current time.
   * @param {string} [nonce] - Optional nonce for replay protection.
   * @returns {{ signature: string, timestamp: number, nonce: string }}
   */
  public signMessage(
    message: string,
    secret: string,
    timestamp = Date.now(),
    nonce = crypto.randomBytes(8).toString("hex")
  ): { signature: string; timestamp: number; nonce: string } {
    const hmac = crypto.createHmac("sha512", secret);
    hmac.update(`${message}.${timestamp}.${nonce}`);
    const signature = hmac.digest("base64");
    return { signature, timestamp, nonce };
  }

  /**
   * @title Verifies a signed message
   * @description Checks the HMAC-SHA512 integrity, timestamp window, and optional nonce replay protection.
   * @param {string} message - The original message string.
   * @param {string} signature - The signature to verify.
   * @param {string} secret - The shared master secret (same used in signMessage).
   * @param {number} timestamp - The timestamp from the sender.
   * @param {string} nonce - The nonce from the sender.
   * @param {number} [maxAgeMs=5*60*1000] - Maximum allowed message age (default 5 minutes).
   * @param {Set<string>} [nonceCache] - Optional in-memory cache to prevent replays.
   * @returns {boolean} True if valid and within time window; otherwise false.
   */
  public verifySignature(
    message: string,
    signature: string,
    secret: string,
    timestamp: number,
    nonce: string,
    maxAgeMs = 5 * 60 * 1000,
    nonceCache?: Set<string>
  ): boolean {
    const now = Date.now();

    // Reject old or future timestamps
    if (Math.abs(now - timestamp) > maxAgeMs) return false;

    // Check nonce replay
    if (nonceCache && nonceCache.has(nonce)) return false;
    if (nonceCache) nonceCache.add(nonce);

    const hmac = crypto.createHmac("sha512", secret);
    hmac.update(`${message}.${timestamp}.${nonce}`);
    const expectedSig = hmac.digest("base64");

    // Constant-time comparison
    const isValid =
      expectedSig.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(signature));

    return isValid;
  }
}

export const encryptionUtils = EncryptionUtils.getInstance();

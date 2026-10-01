import * as crypto from "crypto";
import { ValidationError } from "./errors";

/**
 * Interface for webhook headers as received by a Node.js server (e.g. Express)
 * Note: Headers are typically lowercased by Node.js
 */
export interface WebhookHeaders {
  "x-webhook-signature"?: string;
  "x-webhook-timestamp"?: string;
  "x-webhook-nonce"?: string;
  "x-webhook-version"?: string;
  [key: string]: string | string[] | undefined;
}

/**
 * Webhook utilities for verifying authenticity of incoming requests
 */
export class Webhook {
  /**
   * Header names used by Kyrazo
   */
  public static readonly HEADERS = {
    SIGNATURE: "x-webhook-signature",
    TIMESTAMP: "x-webhook-timestamp",
    NONCE: "x-webhook-nonce",
    VERSION: "x-webhook-version",
  } as const;

  /**
   * Verify a webhook signature
   *
   * @param payload - The raw request body string
   * @param headers - The incoming request headers
   * @param secret - The signing secret for the target
   * @param tolerance - Maximum allowed age of the request in seconds (default: 300)
   * @returns true if the signature is valid
   * @throws ValidationError if verification fails
   */
  public static verify(
    payload: string,
    headers: WebhookHeaders,
    secret: string,
    tolerance: number = 300,
  ): boolean {
    const signatureHeader = headers[this.HEADERS.SIGNATURE];
    const timestamp = headers[this.HEADERS.TIMESTAMP];
    const nonce = headers[this.HEADERS.NONCE];
    const version = headers[this.HEADERS.VERSION];

    if (
      typeof signatureHeader !== "string" ||
      typeof timestamp !== "string" ||
      typeof nonce !== "string" ||
      typeof version !== "string"
    ) {
      throw new ValidationError("Missing required webhook headers");
    }

    // Verify timestamp tolerance to prevent replay attacks
    const now = Math.floor(Date.now() / 1000);
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts) || Math.abs(now - ts) > tolerance) {
      throw new ValidationError("Webhook timestamp expired or invalid");
    }

    // signature format is "v1={hash}"
    const [headerVersion, signature] = signatureHeader.split("=");
    if (headerVersion !== "v1" || !signature) {
      throw new ValidationError("Invalid webhook signature format");
    }

    // Construct payload: version.timestamp.nonce.body
    const signedPayload = `${version}.${timestamp}.${nonce}.${payload}`;

    // Compute expected HMAC
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    // Use timing-safe comparison
    try {
      if (
        crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature),
        )
      ) {
        return true;
      }
    } catch (e) {
      // Buffer length mismatch or other error
    }

    throw new ValidationError("Webhook signature verification failed");
  }
}

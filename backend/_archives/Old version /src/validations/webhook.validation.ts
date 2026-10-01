import z from "zod";

export const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

export const webhookStatus = z.enum(["active", "inactive"]);
export const webhookType = z.enum(["publish", "receive", "forward"], 'Invalid webhookType');
export const webhookService = z.enum(["general", "paypal"], "Invalid service");

export const webhookAuthType = z.enum([
    "service",
    "hmac",
    "api_key",
    "basic_auth",
]);
export const webhookAuthHmacAlgorithm = z.enum([
    "sha1",
    "sha256",
    "sha512",
    "md5",
]);
export const webhookAuthHmacEncoding = z.enum(["base64", "base64url", "hex"]);


export type WebhookService = z.infer<typeof webhookService>;
export type WebhookType = z.infer<typeof webhookType>;
export type WebhookStatus = z.infer<typeof webhookStatus>;

export type WebhookAuthType = z.infer<typeof webhookAuthType>;
export type WebhookAuthHmacAlgorithm = z.infer<typeof webhookAuthHmacAlgorithm>;
export type WebhookAuthHmacEncoding = z.infer<typeof webhookAuthHmacEncoding>;

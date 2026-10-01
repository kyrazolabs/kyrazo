/**
 * Validation utilities
 */

import { ValidationError } from "../errors";

/**
 * Validate that a value is a non-empty string
 */
export function validateString(value: unknown, fieldName: string): asserts value is string {
    if (typeof value !== "string") {
        throw new ValidationError(`${fieldName} must be a string`);
    }
    if (value.trim().length === 0) {
        throw new ValidationError(`${fieldName} cannot be empty`);
    }
}

/**
 * Validate that a value is a valid URL
 */
export function validateUrl(value: unknown, fieldName: string): asserts value is string {
    validateString(value, fieldName);

    try {
        new URL(value);
    } catch {
        throw new ValidationError(`${fieldName} must be a valid URL`);
    }
}

/**
 * Validate that a value is a non-empty array
 */
export function validateArray<T>(value: unknown, fieldName: string): asserts value is T[] {
    if (!Array.isArray(value)) {
        throw new ValidationError(`${fieldName} must be an array`);
    }
    if (value.length === 0) {
        throw new ValidationError(`${fieldName} cannot be empty`);
    }
}

/**
 * Validate that a value is a plain object
 */
export function validateObject(value: unknown, fieldName: string): asserts value is Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new ValidationError(`${fieldName} must be an object`);
    }
}

/**
 * Validate required fields exist in an object
 */
export function validateRequired<T extends object>(
    obj: T,
    requiredFields: (keyof T)[]
): void {
    const missing: string[] = [];

    for (const field of requiredFields) {
        if (obj[field] === undefined || obj[field] === null) {
            missing.push(String(field));
        }
    }

    if (missing.length > 0) {
        throw new ValidationError(`Missing required fields: ${missing.join(", ")}`);
    }
}

/**
 * Validate MongoDB ObjectId format
 */
export function validateObjectId(value: unknown, fieldName: string): asserts value is string {
    validateString(value, fieldName);

    const objectIdRegex = /^[a-fA-F0-9]{24}$/;
    if (!objectIdRegex.test(value)) {
        throw new ValidationError(`${fieldName} must be a valid ObjectId`);
    }
}

/**
 * Validate event type format (e.g., "resource.action")
 */
export function validateEventType(value: unknown, fieldName: string): asserts value is string {
    validateString(value, fieldName);

    const eventTypeRegex = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
    if (!eventTypeRegex.test(value)) {
        throw new ValidationError(
            `${fieldName} must be in format "resource.action" (e.g., "user.created")`
        );
    }
}

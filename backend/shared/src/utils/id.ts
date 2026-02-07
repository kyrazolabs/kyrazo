import { Types } from 'mongoose';

export const ID_PREFIXES = {
    project: 'pro',
    source: 'src',
    target: 'trg',
    endpoint: 'end',
    workspace: 'wsp', // Added just in case
} as const;

export type IdType = keyof typeof ID_PREFIXES;

/**
 * Prefixes a MongoDB ObjectId with a type-specific prefix.
 * @param id The ObjectId or string representation
 * @param type The type of the ID
 * @returns Prefixed ID string
 */
export function prefixId(
    id: string | Types.ObjectId | undefined | null,
    type: IdType
): string | undefined {
    if (!id) return undefined;
    const stringId = id instanceof Types.ObjectId ? id.toHexString() : id;
    const prefix = ID_PREFIXES[type];
    if (stringId.startsWith(`${prefix}_`)) return stringId;
    return `${prefix}_${stringId}`;
}

/**
 * Removes the prefix from a prefixed ID string.
 * @param prefixedId The prefixed ID string
 * @returns Plain hex string (ObjectId compatible)
 */
export function unprefixId(prefixedId: string | undefined | null): string | undefined {
    if (!prefixedId) return undefined;
    if (typeof prefixedId !== 'string') return prefixedId;

    const parts = prefixedId.split('_');
    if (parts.length === 2 && Object.values(ID_PREFIXES).includes(parts[0] as any)) {
        return parts[1];
    }
    return prefixedId;
}

/**
 * Validates if a string is a valid prefixed ID.
 * @param id The string to validate
 * @param type Optional specific type to check against
 * @returns boolean
 */
export function isValidPrefixedId(id: string | undefined | null, type?: IdType): boolean {
    if (!id) return false;
    const prefix = type ? ID_PREFIXES[type] : undefined;
    const regex = prefix
        ? new RegExp(`^${prefix}_[0-9a-fA-F]{24}$`)
        : new RegExp(`^([a-z]{3})_[0-9a-fA-F]{24}$`);

    return regex.test(id);
}

/**
 * Transforms a plain object or array of objects by prefixing their _id and removing it.
 * @param data The object or array to transform
 * @param type The type of ID
 * @returns The transformed data
 */
export function transformWithId<T>(data: T, type: IdType): T {
    if (!data) return data;

    if (Array.isArray(data)) {
        return data.map(item => transformWithId(item, type)) as unknown as T;
    }

    if (typeof data === 'object') {
        const obj = { ...data } as any;
        if (obj._id) {
            obj.id = prefixId(obj._id, type);
            delete obj._id;
        }
        // Also handle nested objects if they are lean results with _id
        for (const key in obj) {
            if (obj[key] && typeof obj[key] === 'object') {
                // We don't know the type of nested objects usually,
                // but if they have _id we might want to transform them.
                // For now keep it simple and only transform top level.
            }
        }
        return obj as T;
    }

    return data;
}

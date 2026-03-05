import { Types } from 'mongoose';

export const ID_PREFIXES = {
    project: 'pro',
    source: 'src',
    target: 'trg',
    endpoint: 'end',
    workspace: 'wsp',
    userWorkspace: 'uw',
    workspaceInvitation: 'winv',
    user: 'usr',
    subscription: 'sub',
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
 * Type helper for transformed data with prefixed ID.
 */
export type TransformedWithId<T> = T extends (infer U)[]
    ? (U extends { _id: any } ? Omit<U, '_id'> & { id: string } : U)[]
    : T extends { _id: any }
      ? Omit<T, '_id'> & { id: string }
      : T;

/**
 * Transforms a plain object or array of objects by prefixing their _id and removing it.
 * @param data The object or array to transform
 * @param type The type of ID
 * @returns The transformed data
 */
export function transformWithId<T>(data: T, type: IdType): TransformedWithId<T> {
    if (!data) return data as any;

    if (Array.isArray(data)) {
        return data.map(item => transformWithId(item, type)) as any;
    }

    if (typeof data === 'object' && data !== null) {
        // If it's a Mongoose document, it might have toObject
        const obj =
            typeof (data as any).toObject === 'function' ? (data as any).toObject() : { ...data };

        if (obj._id) {
            obj.id = prefixId(obj._id, type);
            delete obj._id;
        }

        // Common ID fields that should be prefixed
        const idFields: Record<string, IdType> = {
            workspaceId: 'workspace',
            projectId: 'project',
            sourceId: 'source',
            targetId: 'target',
            endpointId: 'endpoint',
            userId: 'user',
            subscriptionId: 'subscription',
        };

        for (const [field, idType] of Object.entries(idFields)) {
            if (obj[field]) {
                const value = obj[field];
                if (
                    value instanceof Types.ObjectId ||
                    (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value))
                ) {
                    obj[field] = prefixId(value, idType);
                }
            }
        }

        // Recurse into populated objects/arrays
        const commonRefFields: Record<string, IdType> = {
            workspace: 'workspace',
            project: 'project',
            source: 'source',
            target: 'target',
            endpoint: 'endpoint',
            user: 'user',
        };

        for (const [field, idType] of Object.entries(commonRefFields)) {
            if (obj[field] && typeof obj[field] === 'object') {
                obj[field] = transformWithId(obj[field], idType);
            }
        }

        return obj as any;
    }

    return data as any;
}

import { Types } from 'mongoose';

export const ID_PREFIXES = {
    namespace: 'ns',
    source: 'src',
    target: 'trg',
    endpoint: 'end',
    workspace: 'wsp',
    userWorkspace: 'uw',
    workspaceInvitation: 'winv',
    user: 'usr',
    subscription: 'sub',
    event: 'evt',
    delivery: 'del',
    apiKey: 'key',
} as const;

export type IdType = keyof typeof ID_PREFIXES;

/**
 * Prefixes a MongoDB ObjectId with a type-specific prefix.
 * @param id The ObjectId or string representation
 * @param type The type of the ID
 * @returns Prefixed ID string
 */
export function prefixId(id: any, type: IdType): string | undefined {
    if (id === undefined || id === null) return undefined;
    const stringId = id instanceof Types.ObjectId ? id.toHexString() : String(id);
    const prefix = ID_PREFIXES[type];
    if (stringId.startsWith(`${prefix}_`)) return stringId;
    return `${prefix}_${stringId}`;
}

/**
 * Removes the prefix from a prefixed ID string.
 * @param prefixedId The prefixed ID string
 * @returns Plain hex string (ObjectId compatible)
 */
export function unprefixId(prefixedId: any): string | undefined {
    if (prefixedId === undefined || prefixedId === null) return undefined;

    // Convert to string for processing
    const str = String(prefixedId);
    if (!str) return undefined;

    const parts = str.split('_');
    if (parts.length === 2 && Object.values(ID_PREFIXES).includes(parts[0] as any)) {
        return parts[1];
    }
    return str;
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

    // For event and delivery, we now use Snowflake IDs (UInt64 numeric strings)
    if (
        type === 'event' ||
        type === 'delivery' ||
        (!type && (id.startsWith('evt_') || id.startsWith('del_')))
    ) {
        const regex = prefix ? new RegExp(`^${prefix}_[0-9]+$`) : new RegExp(`^(evt|del)_[0-9]+$`);
        return regex.test(id);
    }

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
            namespaceId: 'namespace',
            sourceId: 'source',
            targetId: 'target',
            endpointId: 'endpoint',
            userId: 'user',
            subscriptionId: 'subscription',
            eventId: 'event',
            deliveryId: 'delivery',
            apiKeyId: 'apiKey',
            keyId: 'apiKey',
            event_id: 'event',
            delivery_id: 'delivery',
            associated_event_id: 'event',
            target_id: 'target',
            workspace_id: 'workspace',
            namespace_id: 'namespace',
            source_id: 'source',
            endpoint_id: 'endpoint',
            user_id: 'user',
            subscription_id: 'subscription',
            ingress_id: 'source', // Using 'source' prefix for ingress IDs
            // Aliases used in some queries
            target: 'target',
            source: 'source',
            namespace: 'namespace',
            workspace: 'workspace',
            id: type, // Fallback for 'id' field
        };

        for (const [field, idType] of Object.entries(idFields)) {
            if (obj[field]) {
                const value = obj[field];
                if (
                    value instanceof Types.ObjectId ||
                    typeof value === 'string' ||
                    typeof value === 'number' ||
                    typeof value === 'bigint'
                ) {
                    const stringValue = String(value);
                    if (
                        /^[0-9a-fA-F]{24}$/.test(stringValue) || // Mongo OID
                        /^[0-9]+$/.test(stringValue) || // Numeric ID
                        stringValue.includes('_') // Already looks prefixed
                    ) {
                        obj[field] = prefixId(value, idType as IdType);
                    }
                }
            }
        }

        // Recurse into populated objects/arrays
        const commonRefFields: Record<string, IdType> = {
            workspace: 'workspace',
            namespace: 'namespace',
            source: 'source',
            target: 'target',
            endpoint: 'endpoint',
            user: 'user',
        };

        for (const [field, idType] of Object.entries(commonRefFields)) {
            if (obj[field] && typeof obj[field] === 'object') {
                obj[field] = transformWithId(obj[field], idType as IdType);
            }
        }

        return obj as any;
    }

    return data as any;
}

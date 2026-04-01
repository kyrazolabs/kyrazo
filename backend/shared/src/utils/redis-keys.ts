import { unprefixId } from './id';

/**
 * @title RedisKeys
 * @description Centralized builder for all Redis keys used across the Kyrazo platform.
 * Ensures consistent naming conventions and prevents collisions.
 */
export const RedisKeys = {
    auth: {
        otpEmail: (action: string, userId: string) =>
            `auth:otp:email:${action}:${unprefixId(userId)}`,
        otpTemp2fa: (token: string) => `auth:otp:temp-2fa:${token}`,
        otpVerified: (action: string, userId: string) =>
            `auth:otp:verified:${action}:${unprefixId(userId)}`,
        sensitiveAction: (action: string) => `auth:sensitive-action:${action}`,
        apiKey: (kid: string) => `auth:api-key:with-user:${kid}`,
    },
    billing: {
        subscription: (id: string) => `billing:subscription:${unprefixId(id)}`,
        workspacePlan: (id: string) => `billing:workspace-plan:${unprefixId(id)}`,
    },
    usage: {
        eventCount: (id: string, month: string) => `usage:event-count:${unprefixId(id)}:${month}`,
    },
    limit: {
        prefix: 'limit',
        apiRateSuffix: (key: string) => `api-rate:${key}`,
        userRateSuffix: (id: string) => `user-rate:${unprefixId(id)}`,
        ipRateSuffix: (ip: string) => `ip-rate:${ip}`,
        planReadIpSuffix: (ip: string) => `plan-read-ip:${ip}`,

        // Full keys for manual usage
        apiRate: (key: string) => `limit:api-rate:${key}`,
        userRate: (id: string) => `limit:user-rate:${unprefixId(id)}`,
        ipRate: (ip: string) => `limit:ip-rate:${ip}`,
        planReadIp: (ip: string) => `limit:plan-read-ip:${ip}`,
        feature: (feature: string, workspaceId: string) =>
            `limit:feature:${feature}:${unprefixId(workspaceId)}`,
    },
    context: {
        workspaceUser: (workspaceId: string, userId: string) =>
            `context:workspace:${unprefixId(workspaceId)}:user:${unprefixId(userId)}`,
        workspaceNamespace: (workspaceId: string, namespaceId: string) =>
            `context:workspace:${unprefixId(workspaceId)}:namespace:${unprefixId(namespaceId)}`,
        workspaceNamespaceSources: (workspaceId: string, namespaceId: string) =>
            `context:workspace:${unprefixId(workspaceId)}:namespace:${unprefixId(namespaceId)}:sources`,
        workspaceNamespaceTargets: (workspaceId: string, namespaceId: string) =>
            `context:workspace:${unprefixId(workspaceId)}:namespace:${unprefixId(namespaceId)}:targets`,
        workspaceNamespaceEndpoints: (workspaceId: string, namespaceId: string) =>
            `context:workspace:${unprefixId(workspaceId)}:namespace:${unprefixId(namespaceId)}:endpoints`,
        workspaceNamespaceTarget: (workspaceId: string, namespaceId: string, targetId: string) =>
            `context:workspace:${unprefixId(workspaceId)}:namespace:${unprefixId(namespaceId)}:target:${unprefixId(targetId)}`,
        workspaceNamespaceEndpoint: (workspaceId: string, namespaceId: string, endpointId: string) =>
            `context:workspace:${unprefixId(workspaceId)}:namespace:${unprefixId(namespaceId)}:endpoint:${unprefixId(endpointId)}`,
        namespace: (id: string) => `context:namespace:${unprefixId(id)}`,
        namespaceConfig: (id: string) => `context:namespace:${unprefixId(id)}:config`,
        source: (id: string) => `context:source:${unprefixId(id)}`,
        target: (id: string) => `context:target:${unprefixId(id)}`,
        endpoint: (id: string) => `context:endpoint:${unprefixId(id)}`,
    },
    ingest: {
        endpoint: (id: string) => `ingest:endpoint:${unprefixId(id)}`,
    },
    receiver: {
        source: (type: string, id: string) => `receiver:source:${type}:${unprefixId(id)}`,
    },
    idempotency: {
        key: (workspaceId: string, path: string, idempotencyKey: string) =>
            `idempotency:${unprefixId(workspaceId)}:${path}:${idempotencyKey}`,
    },
};

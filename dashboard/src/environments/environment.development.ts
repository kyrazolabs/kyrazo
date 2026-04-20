import { EndpointStatus } from '@models/endpoint.types';

const baseUrl = 'http://localhost:3003';
export const environment = {
    production: false,
    baseUrl,
    auth: {
        login: `${baseUrl}/v1/auth/login`,
        googleLogin: `${baseUrl}/v1/auth/google`,
        googleClientId: `186041397422-044ckdegk8f5n9paeedif68t1kgj435p.apps.googleusercontent.com`,
        register: `${baseUrl}/v1/auth/register`,
        forgetPassword: `${baseUrl}/v1/auth/forgot-password`,
        verifyEmail: `${baseUrl}/v1/auth/verify-email`,
        changePassword: `${baseUrl}/v1/auth/change-password`,
        resetPassword: `${baseUrl}/v1/auth/reset-password`,
        refreshToken: `${baseUrl}/v1/auth/refresh-token`,
        verify2fa: `${baseUrl}/v1/auth/2fa/login`,
        setup2fa: `${baseUrl}/v1/auth/2fa/setup`,
        verify2faSetup: `${baseUrl}/v1/auth/2fa/verify-setup`,
        requestOTP: `${baseUrl}/v1/auth/otp/request`,
        verifyOTP: `${baseUrl}/v1/auth/otp/verify`,
        disable2fa: `${baseUrl}/v1/auth/2fa/disable`,
        resend2fa: `${baseUrl}/v1/auth/2fa/resend`,
    },
    source: {
        create: `${baseUrl}/v1/sources`,
        get: (id: string) => `${baseUrl}/v1/sources/${id}`,
        gets: `${baseUrl}/v1/sources`,
        update: (id: string) => `${baseUrl}/v1/sources/${id}`,
        updateAuth: (id: string) => `${baseUrl}/v1/sources/${id}/auth`,
        delete: (id: string) => `${baseUrl}/v1/sources/${id}`,
    },
    target: {
        create: `${baseUrl}/v1/targets`,
        getAll: `${baseUrl}/v1/targets`,
        getOne: (id: string) => `${baseUrl}/v1/targets/${id}`,
        getSecret: (id: string) => `${baseUrl}/v1/targets/${id}/secret`,
        update: (id: string) => `${baseUrl}/v1/targets/${id}`,
        updateStatus: (id: string) => `${baseUrl}/v1/targets/${id}`,
        delete: (id: string) => `${baseUrl}/v1/targets/${id}`,
    },
    endpoint: {
        create: `${baseUrl}/v1/endpoints`,
        get: (id: string) => `${baseUrl}/v1/endpoints/${id}`,
        getSecret: (id: string) => `${baseUrl}/v1/endpoints/${id}/secret`,
        gets: `${baseUrl}/v1/endpoints`,
        update: (id: string) => `${baseUrl}/v1/endpoints/${id}`,
        updateStatus: (id: string, status: EndpointStatus) =>
            `${baseUrl}/v1/endpoints/${id}/${status}`,
        delete: (id: string) => `${baseUrl}/v1/endpoints/${id}`,
    },
    delivery: {
        get: (id: string) => `${baseUrl}/v1/deliveries/${id}`,
        gets: `${baseUrl}/v1/deliveries`,
        getTargets: `${baseUrl}/v1/deliveries/targets`,
        getByTarget: (targetId: string) =>
            `${baseUrl}/v1/deliveries/targets/${targetId}`,
        getBySource: (id: string) => `${baseUrl}/v1/deliveries/webhook/${id}`,
        getStats: `${baseUrl}/v1/deliveries/stats`,
        getStatsByTarget: (targetId: string) =>
            `${baseUrl}/v1/deliveries/targets/${targetId}/overview`,
    },
    key: {
        create: `${baseUrl}/v1/keys`,
        gets: `${baseUrl}/v1/keys`,
        checkScopes: (id: string) => `${baseUrl}/v1/keys/check-scopes/${id}`,
        revoke: (id: string) => `${baseUrl}/v1/keys/${id}`,
    },
    profile: {
        get: `${baseUrl}/v1/profile`,
        update: `${baseUrl}/v1/profile`,
        preference: {
            get: `${baseUrl}/v1/profile/preferences`,
            update: `${baseUrl}/v1/profile/preferences`,
        },
    },
    subscription: {
        base: `${baseUrl}/v1/subscriptions`,
        plans: `${baseUrl}/v1/plans`,
        changePlan: (id: string) =>
            `${baseUrl}/v1/subscriptions/${id}/change-plan`,
        cancel: (id: string) => `${baseUrl}/v1/subscriptions/${id}/cancel`,
        invoices: `${baseUrl}/v1/subscriptions/invoices`,
        verifyCheckout: `${baseUrl}/v1/subscriptions/checkout/verify`,
    },
    payment: {
        subscribe: `${baseUrl}/v1/payments/subscribe`,
        portal: `${baseUrl}/v1/payments/portal`,
    },
    workspace: {
        create: `${baseUrl}/v1/workspaces`,
        gets: `${baseUrl}/v1/workspaces`,
        get: (id: string) => `${baseUrl}/v1/workspaces/${id}`,
        update: (id: string) => `${baseUrl}/v1/workspaces/${id}`,
        delete: (id: string) => `${baseUrl}/v1/workspaces/${id}`,
        restore: (id: string) => `${baseUrl}/v1/workspaces/${id}/restore`,
        archive: (id: string) => `${baseUrl}/v1/workspaces/${id}/archive`,
        unarchive: (id: string) => `${baseUrl}/v1/workspaces/${id}/unarchive`,
        invite: (id: string) => `${baseUrl}/v1/workspaces/${id}/invitations`,
        acceptInvitation: (token: string) =>
            `${baseUrl}/v1/workspaces/invitations/${token}/accept`,
        rejectInvitation: (token: string) =>
            `${baseUrl}/v1/workspaces/invitations/${token}/reject`,
        removeMember: (workspaceId: string, userId: string) =>
            `${baseUrl}/v1/workspaces/${workspaceId}/members/${userId}`,
        updateMemberRole: (workspaceId: string) =>
            `${baseUrl}/v1/workspaces/${workspaceId}/members/role`,
        getMembers: (id: string) => `${baseUrl}/v1/workspaces/${id}/members`,
        getInvitationDetails: (token: string) =>
            `${baseUrl}/v1/workspaces/invitations/details/${token}`,
        leave: (id: string) => `${baseUrl}/v1/workspaces/${id}/leave`,
    },

    namespace: {
        create: `${baseUrl}/v1/namespaces`,
        getWorkspaceNamespaces: `${baseUrl}/v1/namespaces/workspace`,
        get: (id: string) => `${baseUrl}/v1/namespaces/${id}`,
        update: (id: string) => `${baseUrl}/v1/namespaces/${id}`,
        delete: (id: string) => `${baseUrl}/v1/namespaces/${id}`,
        restore: (id: string) => `${baseUrl}/v1/namespaces/${id}/restore`,
    },
    analytics: {
        dispatchUsage: `${baseUrl}/v1/analytics/dispatch/usage`,
        ingestUsage: `${baseUrl}/v1/analytics/ingest/usage`,
        targetOverview: (targetId: string) =>
            `${baseUrl}/v1/analytics/targets/${targetId}/overview`,
    },
    sentry: {
        dsn: 'https://c3803071d2f195c52eb7a5e915b895fc@o4510640976625664.ingest.de.sentry.io/4510640978657360',
        enabled: false,
    },
    posthog: {
        key: 'phc_3YHwJQbSU1f4xiVk8uPVtArvWAhGh55nZOQ3Oc49Cy2',
        host: 'https://eu.i.posthog.com',
    },
    ingest: {
        gets: `${baseUrl}/v1/ingest/events`,
        get: (id: string) => `${baseUrl}/v1/ingest/events/${id}`,
        getBySource: (id: string) => `${baseUrl}/v1/ingest/source/${id}`,
        ingress: (id: string) => `${baseUrl}/v1/ingest/${id}`,
    },
    worker: {
        status: `${baseUrl}/v1/workers/status`,
    },
    transform: {
        gets: `${baseUrl}/v2/transforms`,
        get: (id: string) => `${baseUrl}/v2/transforms/${id}`,
        create: `${baseUrl}/v2/transforms`,
        update: (id: string) => `${baseUrl}/v2/transforms/${id}`,
        delete: (id: string) => `${baseUrl}/v2/transforms/${id}`,
        test: (id?: string) =>
            id
                ? `${baseUrl}/v2/transforms/${id}/test`
                : `${baseUrl}/v2/transforms/test`,
        versions: (id: string) => `${baseUrl}/v2/transforms/${id}/versions`,
        rollback: (id: string, version: number) =>
            `${baseUrl}/v2/transforms/${id}/rollback/${version}`,
    },
    sourceV2: {
        create: `${baseUrl}/v2/sources`,
        get: (id: string) => `${baseUrl}/v2/sources/${id}`,
        gets: `${baseUrl}/v2/sources`,
        update: (id: string) => `${baseUrl}/v2/sources/${id}`,
        delete: (id: string) => `${baseUrl}/v2/sources/${id}`,
    },
    s3: {
        create: `${baseUrl}/v2/s3`, // Assuming v2 for storage for now as requested
        gets: `${baseUrl}/v2/s3`,
        test: `${baseUrl}/v2/s3/test`,
    },
    asqs: {
        create: `${baseUrl}/v2/asqs`,
        gets: `${baseUrl}/v2/asqs`,
        test: `${baseUrl}/v2/asqs/test`,
    },
};

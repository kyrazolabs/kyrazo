import { EndpointStatus } from '@models/endpoint.types';

export const environment = {
    production: true,
    baseUrl: 'https://api.kyrazo.com/dashboard',
    auth: {
        login: `https://api.kyrazo.com/dashboard/v1/auth/login`,
        googleLogin: `https://api.kyrazo.com/dashboard/v1/auth/google`,
        googleClientId: `728508001048-ebmd262a7drc0k1o5t8q95o3hcrondh7.apps.googleusercontent.com`,
        register: `https://api.kyrazo.com/dashboard/v1/auth/register`,
        forgetPassword: `https://api.kyrazo.com/dashboard/v1/auth/forgot-password`,
        verifyEmail: `https://api.kyrazo.com/dashboard/v1/auth/verify-email`,
        changePassword: `https://api.kyrazo.com/dashboard/v1/auth/change-password`,
        resetPassword: `https://api.kyrazo.com/dashboard/v1/auth/reset-password`,
        refreshToken: `https://api.kyrazo.com/dashboard/v1/auth/refresh-token`,
    },
    source: {
        create: `https://api.kyrazo.com/dashboard/v1/sources`,
        get: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/sources/${id}`,
        gets: `https://api.kyrazo.com/dashboard/v1/sources`,
        update: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/sources/${id}`,
        updateAuth: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/sources/${id}/auth`,
        delete: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/sources/${id}`,
    },
    target: {
        create: `https://api.kyrazo.com/dashboard/v1/targets`,
        getAll: `https://api.kyrazo.com/dashboard/v1/targets`,
        getOne: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/targets/${id}`,
        getSecret: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/targets/${id}/secret`,
        update: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/targets/${id}`,
        updateStatus: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/targets/${id}`,
        delete: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/targets/${id}`,
    },
    endpoint: {
        create: `https://api.kyrazo.com/dashboard/v1/endpoints`,
        get: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/endpoints/${id}`,
        getSecret: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/endpoints/${id}/secret`,
        gets: `https://api.kyrazo.com/dashboard/v1/endpoints`,
        update: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/endpoints/${id}`,
        updateStatus: (id: string, status: EndpointStatus) =>
            `https://api.kyrazo.com/dashboard/v1/endpoints/${id}/${status}`,
        delete: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/endpoints/${id}`,
    },
    delivery: {
        get: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/deliveries/${id}`,
        gets: `https://api.kyrazo.com/dashboard/v1/deliveries`,
        getTargets: `https://api.kyrazo.com/dashboard/v1/deliveries/targets`,
        getByTarget: (target: string) =>
            `https://api.kyrazo.com/dashboard/v1/deliveries/targets/${target}`,
        getBySource: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/deliveries/webhook/${id}`,
        getStats: `https://api.kyrazo.com/dashboard/v1/deliveries/stats`,
        getStatsByTarget: (target: string) =>
            `https://api.kyrazo.com/dashboard/v1/deliveries/targets/${target}/overview`,
    },
    key: {
        create: `https://api.kyrazo.com/dashboard/v1/keys`,
        gets: `https://api.kyrazo.com/dashboard/v1/keys`,
        checkScopes: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/keys/check-scopes/${id}`,
        revoke: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/keys/${id}`,
    },
    profile: {
        get: `https://api.kyrazo.com/dashboard/v1/auth/profile`,
        update: `https://api.kyrazo.com/dashboard/v1/auth/profile`,
        preference: {
            get: `https://api.kyrazo.com/dashboard/v1/auth/profile/preferences`,
            update: `https://api.kyrazo.com/dashboard/v1/auth/profile/preferences`,
        },
    },
    subscription: {
        base: `https://api.kyrazo.com/dashboard/v1/subscriptions`,
        plans: `https://api.kyrazo.com/dashboard/v1/plans`,
        changePlan: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/subscriptions/${id}/change-plan`,
        cancel: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/subscriptions/${id}/cancel`,
    },
    payment: {
        subscribe: `https://api.kyrazo.com/dashboard/v1/payments/subscribe`,
        portal: `https://api.kyrazo.com/dashboard/v1/payments/portal`,
    },
    workspace: {
        create: `https://api.kyrazo.com/dashboard/v1/workspaces`,
        gets: `https://api.kyrazo.com/dashboard/v1/workspaces`,
        get: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/workspaces/${id}`,
        update: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/workspaces/${id}`,
        delete: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/workspaces/${id}`,
        restore: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/workspaces/${id}/restore`,
        archive: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/workspaces/${id}/archive`,
        unarchive: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/workspaces/${id}/unarchive`,
        invite: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/workspaces/${id}/invitations`,
        acceptInvitation: (token: string) =>
            `https://api.kyrazo.com/dashboard/v1/workspaces/invitations/${token}/accept`,
        rejectInvitation: (token: string) =>
            `https://api.kyrazo.com/dashboard/v1/workspaces/invitations/${token}/reject`,
        removeMember: (workspaceId: string, userId: string) =>
            `https://api.kyrazo.com/dashboard/v1/workspaces/${workspaceId}/members/${userId}`,
        updateMemberRole: (workspaceId: string) =>
            `https://api.kyrazo.com/dashboard/v1/workspaces/${workspaceId}/members/role`,
        getMembers: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/workspaces/${id}/members`,
        getInvitationDetails: (token: string) =>
            `https://api.kyrazo.com/dashboard/v1/workspaces/invitations/details/${token}`,
    },

    project: {
        create: `https://api.kyrazo.com/dashboard/v1/projects`,
        getWorkspaceProjects: `https://api.kyrazo.com/dashboard/v1/projects/workspace`,
        get: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/projects/${id}`,
        update: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/projects/${id}`,
        delete: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/projects/${id}`,
        restore: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/projects/${id}/restore`,
    },
    analytics: {
        dispatchUsage: `https://api.kyrazo.com/dashboard/v1/analytics/dispatch/usage`,
        ingestUsage: `https://api.kyrazo.com/dashboard/v1/analytics/ingest/usage`,
        targetOverview: (target: string) =>
            `https://api.kyrazo.com/dashboard/v1/analytics/targets/${target}/overview`,
    },
    sentry: {
        dsn: 'https://c3803071d2f195c52eb7a5e915b895fc@o4510640976625664.ingest.de.sentry.io/4510640978657360',
        enabled: true,
    },
    posthog: {
        key: 'phc_3YHwJQbSU1f4xiVk8uPVtArvWAhGh55nZOQ3Oc49Cy2',
        host: 'https://eu.i.posthog.com',
    },
    ingest: {
        gets: `https://api.kyrazo.com/dashboard/v1/ingest/events`,
        get: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/ingest/events/${id}`,
        getBySource: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/ingest/source/${id}`,
        ingress: (id: string) =>
            `https://api.kyrazo.com/dashboard/v1/ingest/${id}`,
    },
};

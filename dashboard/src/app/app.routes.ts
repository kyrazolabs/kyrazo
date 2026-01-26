import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { noAuthGuard } from '@core/guards/no-auth.guard';

export const routes: Routes = [
    {
        path: 'auth',
        canActivate: [noAuthGuard],
        loadChildren: () =>
            import('@pages/auth/auth.routes').then((r) => r.AuthRoutes),
    },
    {
        path: 'launchpad',
        loadComponent: () =>
            import('@pages/launchpad/launchpad.page').then(
                (p) => p.LaunchpadPage,
            ),
    },
    {
        path: '',
        canActivateChild: [authGuard],
        loadComponent: () =>
            import('@pages/dashboard/app-shell/app-shell').then(
                (p) => p.AppShell,
            ),
        data: { animation: 'dashboard' },
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('@pages/dashboard/dashboard.page').then(
                        (p) => p.DashboardPage,
                    ),
                data: { title: 'Dashboard', animation: 'dashboard-home' },
            },
            {
                path: 'projects',
                loadComponent: () =>
                    import('@pages/dashboard/projects/projects.page').then(
                        (p) => p.ProjectsPage,
                    ),
                data: { title: 'Projects', animation: 'projects' },
            },
            {
                path: 'connectors',
                loadComponent: () =>
                    import('@pages/dashboard/connectors/connectors.page').then(
                        (p) => p.ConnectorsPage,
                    ),
                data: { title: 'Connectors', animation: 'connectors' },
            },
            {
                path: 'inspector',
                loadComponent: () =>
                    import('@pages/dashboard/inspector/inspector.page').then(
                        (p) => p.InspectorPage,
                    ),
                data: { title: 'Connectors', animation: 'inspector' },
            },
            {
                path: 'deliveries',
                loadChildren: () =>
                    import('@pages/dashboard/deliveries/deliveries.routes').then(
                        (p) => p.deliveriesRoutes,
                    ),
            },
            {
                path: 'secrets',
                loadChildren: () =>
                    import('@pages/dashboard/secrets/secrets.routes').then(
                        (p) => p.secretsRoutes,
                    ),
            },
            {
                path: 'events',
                loadChildren: () =>
                    import('@pages/dashboard/events/events.routes').then(
                        (p) => p.eventsRoutes,
                    ),
            },
            {
                path: 'settings',
                loadChildren: () =>
                    import('@pages/dashboard/settings/settings.routes').then(
                        (p) => p.settingsRoutes,
                    ),
            },
        ],
    },
    {
        path: 'invitation/:token',
        canActivate: [authGuard],
        loadComponent: () =>
            import('@pages/dashboard/invitation/invitation.page').then(
                (m) => m.InvitationPage,
            ),
        data: { animation: 'InvitationPage' },
    },
    {
        path: 'verify-email',
        loadComponent: () =>
            import('@pages/auth/verify-email/verify-email.page').then(
                (m) => m.VerifyEmailPage,
            ),
        data: { animation: 'VerifyEmail' },
    },
    {
        path: 'changelogs',
        loadComponent: () =>
            import('@pages/changelogs/changelogs.page').then(
                (p) => p.ChangelogsPage,
            ),
        data: {
            title: 'Changelogs',
            meta: {
                description:
                    'Kyrazo - The Platform Engineering Platform for SaaS. Streamline your infrastructure and deployment workflow.',
                keywords:
                    'SaaS, Platform Engineering, DevOps, Infrastructure, Deployment',
            },
        },
    },
    {
        path: 'not-found',
        loadComponent: () =>
            import('@shared/ui/not-found/not-found.component').then(
                (p) => p.NotFoundComponent,
            ),
        data: { animation: 'not-found' },
    },
    {
        path: '**',
        redirectTo: '/not-found',
        pathMatch: 'full',
    },
];

import { Routes } from '@angular/router';
import {
    deliveriesResolver,
    deliveryResolver,
    eventResolver,
    ingestLogsResolver,
} from '@core/resolver/delivery.resolver';
import { targetResolver, targetsResolver } from '@core/resolver/target.resolver';
import { endpointsResolver, endpointResolver } from '@core/resolver/endpoints.resolver';
import { sourcesResolver } from '@core/resolver/source.resolver';

export const eventsRoutes: Routes = [
    {
        path: '',
        redirectTo: 'playground',
        pathMatch: 'full',
    },
    {
        path: 'dispatch',
        loadComponent: () =>
            import('./dispatch/usage/usage.page').then((p) => p.UsagePage),
        data: { title: 'Dispatch Usage', animation: 'dispatch-usage' },
    },
    {
        path: 'dispatch/targets',
        loadComponent: () =>
            import('./dispatch/targets/targets.page').then(
                (p) => p.TargetsPage,
            ),
        resolve: { targets: targetsResolver },
        data: { title: 'Dispatch Targets', animation: 'dispatch-targets' },
    },
    // {
    //     path: 'dispatch/targets/create',
    //     loadComponent: () =>
    //         import('./dispatch/targets/target/form/form.page').then(
    //             (p) => p.TargetFormPage,
    //         ),
    //     data: { title: 'Create Target', animation: 'dispatch-target-create' },
    // },
    {
        path: 'dispatch/targets/:id',
        loadComponent: () =>
            import('./dispatch/targets/target/target.page').then(
                (p) => p.TargetPage,
            ),
        resolve: { target: targetResolver },
        data: { title: 'Dispatch Target', animation: 'dispatch-target' },
    },
    // {
    //     path: 'dispatch/targets/:id/edit',
    //     loadComponent: () =>
    //         import('./dispatch/targets/target/form/form.page').then(
    //             (p) => p.TargetFormPage,
    //         ),
    //     data: { title: 'Edit Target', animation: 'dispatch-target-edit' },
    // },
    {
        path: 'dispatch/logs',
        loadComponent: () =>
            import('./dispatch/logs/logs.page').then((p) => p.DispatchLogsPage),
        resolve: { data: deliveriesResolver },
        data: { title: 'Dispatch Logs', animation: 'dispatch-logs' },
    },
    {
        path: 'dispatch/logs/:id',
        loadComponent: () =>
            import('./dispatch/logs/log/log.page').then((p) => p.LogPage),
        resolve: { data: deliveryResolver },
        data: { title: 'Dispatch Logs', animation: 'dispatch-log' },
    },
    {
        path: 'ingest',
        loadComponent: () =>
            import('./ingest/usage/usage.page').then((p) => p.UsagePage),
        // resolve: { sources: sourcesResolver }, // Commented out as unused by component
        data: { title: 'Ingest Usage', animation: 'ingest-usage' },
    },
    {
        path: 'ingest/sources',
        loadComponent: () =>
            import('./ingest/sources/sources.page').then((p) => p.SourcesPage),
        resolve: { sources: sourcesResolver },
        data: { title: 'Ingest Sources', animation: 'ingest-usage' },
    },
    // {
    //     path: 'ingest/sources/create',
    //     loadComponent: () =>
    //         import('./ingest/sources/source/form/form.page').then(
    //             (p) => p.FormPage,
    //         ),
    //     data: { title: 'New Source', animation: 'ingest-targets' },
    // },
    {
        path: 'ingest/sources/view/:id',
        loadComponent: () =>
            import('./ingest/sources/source/source.page').then(
                (p) => p.SourcePage,
            ),
        data: { title: 'Source Details', animation: 'ingest-targets' },
    },
    // {
    //     path: 'ingest/sources/:id/edit',
    //     loadComponent: () =>
    //         import('./ingest/sources/source/form/form.page').then(
    //             (p) => p.FormPage,
    //         ),
    //     data: { title: 'Edit Source', animation: 'ingest-targets' },
    // },
    {
        path: 'ingest/endpoints',
        loadComponent: () =>
            import('./ingest/endpoints/endpoints.page').then(
                (p) => p.EndpointsPage,
            ),
        resolve: { data: endpointsResolver },
        data: { title: 'Endpoints', animation: 'endpoints' },
    },
    // {
    //     path: 'ingest/endpoints/create',
    //     loadComponent: () =>
    //         import('./ingest/endpoints/form/form.page').then(
    //             (p) => p.EndpointFormPage,
    //         ),
    //     data: { title: 'Create Endpoint', animation: 'endpoint-create' },
    // },
    {
        path: 'ingest/endpoints/:id',
        loadComponent: () =>
            import('./ingest/endpoints/detail/detail.page').then(
                (p) => p.EndpointDetailPage,
            ),
        resolve: { endpoint: endpointResolver },
        data: { title: 'Endpoint Details', animation: 'endpoint-detail' },
    },
    // {
    //     path: 'ingest/endpoints/:id/edit',
    //     loadComponent: () =>
    //         import('./ingest/endpoints/form/form.page').then(
    //             (p) => p.EndpointFormPage,
    //         ),
    //     data: { title: 'Edit Endpoint', animation: 'endpoint-edit' },
    // },
    {
        path: 'ingest/logs',
        loadComponent: () =>
            import('./ingest/logs/logs.page').then((p) => p.IngestLogsPage),
        resolve: { data: ingestLogsResolver },
        data: { title: 'Ingest Logs', animation: 'ingest-logs' },
    },
    {
        path: 'ingest/logs/:eventId',
        loadComponent: () =>
            import('./ingest/logs/log/log.page').then((p) => p.LogPage),
        resolve: { data: eventResolver },
        data: { title: 'Ingest Log', animation: 'ingest-log' },
    },
];

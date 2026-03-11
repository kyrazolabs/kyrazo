import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '@core/services/storage.service';

export const namespaceInterceptor: HttpInterceptorFn = (req, next) => {
    const ss = inject(StorageService);
    const workspace = ss.getItem<string>('workspace');
    const namespace = ss.getItem<string>('namespace');

    if (
        req.url.includes('/v1/sources') ||
        req.url.includes('/v1/endpoints') ||
        req.url.includes('/v1/deliveries') ||
        req.url.includes('/v1/keys') ||
        req.url.includes('/v1/analytics') ||
        req.url.includes('/v1/targets') ||
        req.url.includes('/v1/plans') ||
        req.url.includes('/v1/subscriptions') ||
        req.url.includes('/v1/payment') ||
        req.url.includes('/v1/support')
    ) {
        const headers: { [name: string]: string } = {};
        if (workspace) headers['x-workspace-id'] = workspace;
        if (namespace) headers['x-namespace-id'] = namespace;

        const modified = req.clone({
            setHeaders: headers,
        });
        return next(modified);
    }

    return next(req);
};

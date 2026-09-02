import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
    { path: '', renderMode: RenderMode.Prerender },
    { path: 'about', renderMode: RenderMode.Prerender },
    { path: 'pricing', renderMode: RenderMode.Prerender },
    { path: 'legal/privacy-policy', renderMode: RenderMode.Prerender },
    { path: 'legal/refund-policy', renderMode: RenderMode.Prerender },
    { path: 'legal/terms-of-service', renderMode: RenderMode.Prerender },
    { path: 'legal/gdpr', renderMode: RenderMode.Prerender },
    { path: 'legal/dpa', renderMode: RenderMode.Prerender },
    { path: 'not-found', renderMode: RenderMode.Prerender },
    { path: '**', renderMode: RenderMode.Client },
];

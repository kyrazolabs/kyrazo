import { Routes } from '@angular/router';

export const transformsRoutes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./transforms.page').then((m) => m.TransformsPage),
        data: { title: 'Transformers', animation: 'transforms' },
    },
];

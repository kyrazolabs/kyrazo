import { Routes } from '@angular/router';
import { BlogPage } from './blog.page';
import { ArticlePage } from './article/article.page';

export const BLOG_ROUTES: Routes = [
    {
        path: '',
        component: BlogPage,
    },
    {
        path: ':slug',
        component: ArticlePage,
    },
];

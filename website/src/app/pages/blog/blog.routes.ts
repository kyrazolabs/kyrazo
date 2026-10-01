import { Routes } from '@angular/router';
import { BlogPage } from './blog.page';
import { ArticlePage } from './article/article.page';
import { blogResolver } from '@core/resolvers/blog.resolver';
import { articleResolver } from '@core/resolvers/article.resolver';

export const BLOG_ROUTES: Routes = [
    {
        path: '',
        component: BlogPage,
        resolve: { articles: blogResolver },
    },
    {
        path: ':slug',
        component: ArticlePage,
        resolve: { article: articleResolver },
    },
];

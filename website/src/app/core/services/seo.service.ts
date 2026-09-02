import { Injectable, Inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { filter, map, mergeMap } from 'rxjs/operators';
import { SITE_URL, DEFAULT_OG_IMAGE } from '@core/seo/seo.config';

export interface SeoMeta {
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    robots?: string;
}

@Injectable({
    providedIn: 'root',
})
export class SeoService {
    constructor(
        private titleService: Title,
        private metaService: Meta,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        @Inject(DOCUMENT) private _document: Document,
    ) {}

    init() {
        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                map(() => this.activatedRoute),
                map((route) => {
                    while (route.firstChild) route = route.firstChild;
                    return route;
                }),
                mergeMap((route) => route.data),
            )
            .subscribe((data) => {
                const meta: SeoMeta = data['meta'] ?? {};
                const title: string | undefined = data['title'];
                const fullTitle = this.updateTitle(title);
                this.updateMetaTags(meta, fullTitle);
                if ((meta.robots || '').includes('noindex')) {
                    this.clearSchema();
                } else {
                    this.setSchema(data['schema']);
                }
            });
    }

    updateTitle(title?: string): string {
        const fullTitle = title ? `${title} | Kyrazo` : 'Kyrazo';
        this.titleService.setTitle(fullTitle);
        return fullTitle;
    }

    updateMetaTags(meta: SeoMeta, fullTitle: string) {
        const url = this.canonicalUrl(meta.url || this.router.url);
        const image = meta.image || DEFAULT_OG_IMAGE;
        const robots = meta.robots || 'index, follow';

        this.metaService.updateTag({ property: 'og:title', content: fullTitle });
        this.metaService.updateTag({ name: 'twitter:title', content: fullTitle });

        if (meta.description) {
            this.metaService.updateTag({
                name: 'description',
                content: meta.description,
            });
            this.metaService.updateTag({
                property: 'og:description',
                content: meta.description,
            });
            this.metaService.updateTag({
                name: 'twitter:description',
                content: meta.description,
            });
        }

        if (meta.keywords) {
            this.metaService.updateTag({
                name: 'keywords',
                content: meta.keywords,
            });
        }

        this.metaService.updateTag({ property: 'og:image', content: image });
        this.metaService.updateTag({ name: 'twitter:image', content: image });
        this.metaService.updateTag({ property: 'og:url', content: url });
        this.metaService.updateTag({ name: 'twitter:url', content: url });
        this.metaService.updateTag({ property: 'og:type', content: 'website' });
        this.metaService.updateTag({
            property: 'og:site_name',
            content: 'Kyrazo',
        });
        this.metaService.updateTag({
            name: 'twitter:card',
            content: 'summary_large_image',
        });
        this.metaService.updateTag({ name: 'robots', content: robots });

        this.setCanonical(url);
    }

    clearSchema() {
        this._document
            .querySelectorAll('script[type="application/ld+json"]')
            .forEach((node) => node.remove());
    }

    setSchema(schema?: Record<string, unknown> | Record<string, unknown>[]) {
        this.clearSchema();

        const graph: Record<string, unknown>[] = [this.organizationSchema()];

        if (Array.isArray(schema)) {
            graph.push(...schema);
        } else if (schema?.['@graph'] && Array.isArray(schema['@graph'])) {
            graph.push(...(schema['@graph'] as Record<string, unknown>[]));
        } else if (schema) {
            const { '@context': _ctx, ...rest } = schema;
            graph.push(rest);
        }

        const script = this._document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': graph,
        });
        this._document.head.appendChild(script);
    }

    canonicalUrl(path: string): string {
        const raw = path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
        const url = new URL(raw);
        if (url.pathname === '/' || url.pathname === '') {
            return `${SITE_URL}/`;
        }
        const pathname = url.pathname.replace(/\/+$/, '') + '/';
        return `${SITE_URL}${pathname}`;
    }

    private setCanonical(url: string) {
        let link: HTMLLinkElement | null = this._document.querySelector(
            'link[rel="canonical"]',
        );
        if (!link) {
            link = this._document.createElement('link');
            link.setAttribute('rel', 'canonical');
            this._document.head.appendChild(link);
        }
        link.setAttribute('href', url);
    }

    private organizationSchema(): Record<string, unknown> {
        return {
            '@type': 'Organization',
            '@id': `${SITE_URL}/#organization`,
            name: 'Kyrazo',
            url: SITE_URL,
            logo: `${SITE_URL}/logo-light.png`,
            email: 'support@kyrazo.com',
        };
    }
}

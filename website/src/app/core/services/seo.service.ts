import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class SeoService {
    constructor(
        private titleService: Title,
        private metaService: Meta,
        private router: Router,
        private activatedRoute: ActivatedRoute,
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
                this.updateTitle(data['title']);
                this.updateMetaTags(data['meta']);
            });
    }

    updateTitle(title: string) {
        const appName = 'Kyrazo';
        if (title) {
            this.titleService.setTitle(`${title} | ${appName}`);
        } else {
            this.titleService.setTitle(appName);
        }
    }

    updateMetaTags(meta: any) {
        if (!meta) return;

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

        if (meta.image) {
            this.metaService.updateTag({
                property: 'og:image',
                content: meta.image,
            });
            this.metaService.updateTag({
                name: 'twitter:image',
                content: meta.image,
            });
        }

        if (meta.url || true) {
            const url = meta.url || `https://kyrazo.com${this.router.url}`;
            this.metaService.updateTag({ property: 'og:url', content: url });
            this.metaService.updateTag({ name: 'twitter:url', content: url });

            // Update canonical link
            let link: HTMLLinkElement | null = document.querySelector(
                'link[rel="canonical"]',
            );
            if (!link) {
                link = document.createElement('link');
                link.setAttribute('rel', 'canonical');
                document.head.appendChild(link);
            }
            link.setAttribute('href', url);
        }

        // Add default OG tags if missing
        this.metaService.updateTag({ property: 'og:type', content: 'website' });
        this.metaService.updateTag({
            property: 'og:site_name',
            content: 'Kyrazo',
        });
        this.metaService.updateTag({
            name: 'twitter:card',
            content: 'summary_large_image',
        });
    }
}

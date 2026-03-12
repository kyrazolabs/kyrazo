import {
    Component,
    signal,
    afterNextRender,
    OnInit,
    inject,
    DestroyRef,
    PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SeoService } from './core/services/seo.service';
import { AppConfig } from '@components/app.config';
import { environment } from 'environments/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import * as Sentry from '@sentry/angular';
import posthog from 'posthog-js';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, AppConfig],
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App implements OnInit {
    protected readonly title = signal('website');
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly platformId = inject(PLATFORM_ID);

    constructor(private seoService: SeoService) {
        this.seoService.init();

        afterNextRender(() => {
            this.initAnalytics();
        });
    }

    ngOnInit() {
        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(() => {
                if (isPlatformBrowser(this.platformId)) {
                    setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    });
                }
            });
    }

    private initAnalytics() {
        if (environment.posthog.key) {
            posthog.init(environment.posthog.key, {
                api_host: environment.posthog.host,
                person_profiles: 'identified_only',
                capture_pageview: false,
            });
        }

        if (environment.sentry.enabled) {
            Sentry.init({
                dsn: environment.sentry.dsn,
                environment: environment.production
                    ? 'production'
                    : 'development',
                integrations: [Sentry.browserTracingIntegration()],
                tracePropagationTargets: [
                    'localhost',
                    /^\/api\//,
                    'https://kyrazo.com',
                    'https://api.kyrazo.com',
                ],
                tracesSampleRate: 1.0,
                sendDefaultPii: true,
            });
        }
    }
}

import { Component, inject, signal, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
    Router,
    NavigationStart,
    NavigationEnd,
    NavigationCancel,
    NavigationError,
    RouterOutlet,
} from '@angular/router';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { LoaderService } from '@core/services/loader.service';
import { SeoService } from '@core/services/seo.service';
import { PostHogService } from '@core/3rd-party/posthog';

import { routeTransitionAnimations } from '@shared/animations/route.animation';
import { AppConfig } from '@components/app.config';
import { OtpDialogComponent } from '@shared/components/otp-dialog/otp-dialog.component';
@Component({
    selector: 'app-root',
    imports: [
        RouterOutlet,
        CommonModule,
        ButtonModule,
        ToastModule,
        AppConfig,
        OtpDialogComponent,
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    animations: [routeTransitionAnimations],
})
export class AppComponent {
    public loader = inject(LoaderService);
    private posthog = inject(PostHogService);
    private seoService = inject(SeoService);

    loadingMessages = [
        'Loading data...',
        'Checking sessions...',
        'Verifying access...',
        'Almost ready...',
        'Syncing with Kyrazo...',
        'Optimizing interface...',
    ];

    private isLoading = toSignal(this.loader.loading$);
    currentMessageIndex = signal(0);
    currentMessage = computed(
        () => this.loadingMessages[this.currentMessageIndex()],
    );

    constructor(private router: Router) {
        this.seoService.init();
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationStart) {
                this.loader.show();
            } else if (
                event instanceof NavigationEnd ||
                event instanceof NavigationCancel ||
                event instanceof NavigationError
            ) {
                this.loader.hide();
                if (event instanceof NavigationEnd) {
                    this.posthog.trackPageView();
                }
            }
        });

        // Cycle messages when loading
        effect(() => {
            if (this.isLoading()) {
                const intervalId = setInterval(() => {
                    this.currentMessageIndex.update(
                        (i) => (i + 1) % this.loadingMessages.length,
                    );
                }, 6000);
                return () => clearInterval(intervalId);
            }
            this.currentMessageIndex.set(0);
            return;
        });
    }

    prepareRoute(outlet: RouterOutlet) {
        return outlet?.activatedRouteData?.['animation'];
    }
}

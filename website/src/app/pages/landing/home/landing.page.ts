import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '@pages/landing/components/hero/hero.component';
import { FeaturesComponent } from '@pages/landing/components/features/features.component';
import { DevExpComponent } from '@pages/landing/components/dev-exp/dev-exp.component';
import { CtaComponent } from '@pages/landing/components/cta/cta.component';
import { FaqComponent } from '@pages/landing/components/faq/faq.component';
import { TrustComponent } from '@pages/landing/components/trust/trust.component';
import { Motivation } from '@pages/landing/components/motivation/motivation';
import { DedicatedWorkersComponent } from '@pages/landing/components/dedicated-workers/dedicated-workers.component';

import { PostHogService } from '@core/3rd-party/posthog';
import { SeoService } from '@core/services/seo.service';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [
        CommonModule,
        HeroComponent,
        FeaturesComponent,
        DedicatedWorkersComponent,
        DevExpComponent,
        CtaComponent,
        FaqComponent,
        TrustComponent,
        Motivation,
    ],
    templateUrl: './landing.page.html',
    styleUrl: './landing.page.scss',
})
export class LandingPage implements OnInit {
    private posthog = inject(PostHogService);
    private seoService = inject(SeoService);

    ngOnInit() {
        this.posthog.trackPageView();
        this.setSchema();
    }

    private setSchema() {
        this.seoService.setSchema({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Kyrazo',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Web',
            offers: {
                '@type': 'Offer',
                priceCurrency: 'USD',
                price: '0',
            },
            description:
                'Webhooks as a Service platform for reliable event management with dedicated workers.',
            url: 'https://kyrazo.com',
            image: 'https://kyrazo.com/og-image.png',
        });
    }
}

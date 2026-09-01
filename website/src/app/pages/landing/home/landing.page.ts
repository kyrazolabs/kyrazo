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
import { PricingComponent } from '@pages/landing/components/pricing/pricing.component';
import { BookDemoComponent } from '@pages/landing/components/book-demo/book-demo.component';
import { IntegrationsComponent } from '@pages/landing/components/integrations/integrations.component';
import { ComparisonComponent } from '@pages/landing/components/comparison/comparison.component';
import { HeaderThemeDirective } from '@shared/directives/header-theme.directive';
import { HeaderService } from '@shared/services/header.service';

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
        PricingComponent,
        BookDemoComponent,
        IntegrationsComponent,
        ComparisonComponent,
        HeaderThemeDirective,
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
                price: '499',
            },
            description:
                'Dedicated webhook infrastructure for enterprise B2B. Physically isolated compute, databases, and delivery workers with zero noisy-neighbor degradation.',
            url: 'https://kyrazo.com',
            image: 'https://kyrazo.com/og-image.png',
        });
    }
}

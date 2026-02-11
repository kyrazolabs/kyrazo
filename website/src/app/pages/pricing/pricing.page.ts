import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PricingComponent } from '@pages/landing/components/pricing/pricing.component';
import { PricingComparisonComponent } from './comparison/pricing-comparison.component';
import { CtaComponent } from '@pages/landing/components/cta/cta.component';
import { FaqComponent } from '@pages/landing/components/faq/faq.component';
import { Motivation } from '@pages/landing/components/motivation/motivation';
import { PricingCardComponent } from './components/pricing-card/pricing-card.component';
import { PRICING_PLANS } from './pricing.model';
import { signal } from '@angular/core';

import { PostHogService } from '@core/3rd-party/posthog';
import { SeoService } from '@core/services/seo.service';

@Component({
    selector: 'app-pricing-page',
    standalone: true,
    imports: [
        CommonModule,
        PricingComponent,
        PricingComparisonComponent,
        CtaComponent,
        FaqComponent,
        Motivation,
        PricingCardComponent,
    ],
    templateUrl: './pricing.page.html',
    styleUrl: './pricing.page.scss',
})
export class PricingPage implements OnInit {
    private posthog = inject(PostHogService);
    private seoService = inject(SeoService);

    billingCycle = signal<'monthly' | 'yearly'>('monthly');
    plans = PRICING_PLANS;

    ngOnInit() {
        this.posthog.trackPageView();
        this.seoService.setSchema({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Pricing - Kyrazo',
            description:
                'Transparent and flexible pricing plans for Kyrazo webhooks as a service.',
        });
    }
}

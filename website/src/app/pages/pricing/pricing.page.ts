import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PricingComparisonComponent } from './comparison/pricing-comparison.component';
import { CtaComponent } from '@pages/landing/components/cta/cta.component';
import { PricingCardComponent } from './components/pricing-card/pricing-card.component';
import { MANUAL_CUSTOM_PLAN, PricingPlan } from './pricing.model';
import { signal } from '@angular/core';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';

import { PostHogService } from '@core/3rd-party/posthog';
import { SeoService } from '@core/services/seo.service';
import { PricingService } from '@core/services/pricing.service';

@Component({
    selector: 'app-pricing-page',
    standalone: true,
    imports: [
        CommonModule,
        PricingComparisonComponent,
        CtaComponent,
        PricingCardComponent,
        ScrollRevealDirective,
    ],
    templateUrl: './pricing.page.html',
    styleUrl: './pricing.page.scss',
})
export class PricingPage implements OnInit {
    private posthog = inject(PostHogService);
    private seoService = inject(SeoService);
    private pricingService = inject(PricingService);

    billingCycle = signal<'monthly' | 'yearly'>('monthly');
    hasInteracted = signal(false);
    shakeToggle = signal(false);
    lightningOffset = signal(0);
    plans = signal<PricingPlan[]>([]);

    toggleCycle() {
        this.hasInteracted.set(true);
        this.shakeToggle.update((s) => !s);
        this.lightningOffset.set(Math.random() * 40 - 20); // -20 to +20 degree skew
        this.billingCycle.update((c) =>
            c === 'monthly' ? 'yearly' : 'monthly',
        );
    }

    ngOnInit() {
        this.posthog.trackPageView();
        this.seoService.setSchema({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Pricing - Kyrazo',
            description:
                'Transparent and flexible pricing plans for Kyrazo webhooks as a service.',
        });

        this.loadPlans();
    }

    private loadPlans() {
        this.pricingService.getPlans().subscribe((apiPlans) => {
            // Merge API plans with the manual custom plan
            // You can also add more logic here to filter or sort
            this.plans.set([...apiPlans, MANUAL_CUSTOM_PLAN]);
        });
    }
}

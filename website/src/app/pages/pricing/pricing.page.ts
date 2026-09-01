import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PricingComparisonComponent } from './comparison/pricing-comparison.component';
import { CtaComponent } from '@pages/landing/components/cta/cta.component';
import { PricingCardComponent } from './components/pricing-card/pricing-card.component';
import {
    ENTERPRISE_PLAN,
    PROFESSIONAL_PLAN,
    PricingPlan,
} from './pricing.model';
import { signal } from '@angular/core';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';

import { PostHogService } from '@core/3rd-party/posthog';
import { SeoService } from '@core/services/seo.service';
import { AvatarModule } from 'primeng/avatar';

@Component({
    selector: 'app-pricing-page',
    standalone: true,
    imports: [
        CommonModule,
        PricingComparisonComponent,
        CtaComponent,
        PricingCardComponent,
        ScrollRevealDirective,
        AvatarModule,
    ],
    templateUrl: './pricing.page.html',
    styleUrl: './pricing.page.scss',
})
export class PricingPage implements OnInit {
    private posthog = inject(PostHogService);
    private seoService = inject(SeoService);

    billingCycle = signal<'monthly'>('monthly');
    plans = signal<PricingPlan[]>([PROFESSIONAL_PLAN, ENTERPRISE_PLAN]);

    ngOnInit() {
        this.posthog.trackPageView();
        this.seoService.setSchema({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Pricing - Kyrazo',
            description:
                'Dedicated webhook infrastructure pricing for enterprise B2B. Isolated compute, database, and delivery workers on annual or custom contracts.',
        });
    }
}

import { Component } from '@angular/core';
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
export class PricingPage {
    billingCycle = signal<'monthly'>('monthly');
    plans = signal<PricingPlan[]>([PROFESSIONAL_PLAN, ENTERPRISE_PLAN]);
}

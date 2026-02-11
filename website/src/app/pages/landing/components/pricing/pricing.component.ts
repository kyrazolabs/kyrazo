import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { PRICING_PLANS, PricingPlan } from '../../../pricing/pricing.model';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';

@Component({
    selector: 'app-landing-pricing',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, ScrollRevealDirective],
    templateUrl: './pricing.component.html',
    styleUrl: './pricing.component.scss',
})
export class PricingComponent {
    plans: PricingPlan[] = PRICING_PLANS;

    formatPrice(cents: number): string {
        if (cents === 0) return '€0';
        return `€${cents / 100}`;
    }
}

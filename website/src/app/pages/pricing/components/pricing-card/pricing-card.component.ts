import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { PricingPlan } from '../../pricing.model';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';
import { Router } from '@angular/router';

@Component({
    selector: 'app-pricing-card',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, ScrollRevealDirective],
    templateUrl: './pricing-card.component.html',
    styleUrl: './pricing-card.component.scss',
})
export class PricingCardComponent {
    @Input() plan!: PricingPlan;
    @Input() isYearly = false;
    @Input() delay = '';

    private router = inject(Router);

    get currentPrice(): number {
        return this.isYearly
            ? this.plan.priceCentsYearly / 10
            : this.plan.priceCentsMonthly;
    }

    get intervalLabel(): string {
        return this.isYearly ? '/m, billed yearly' : '/month';
    }

    formatPrice(cents: number): string {
        if (cents === 0) return '0';
        return (cents / 100).toString();
    }
}

import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { PricingPlan } from '../../pricing.model';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';
import { UmamiService } from '@core/3rd-party/umami';
import { CalendlyService } from '@shared/services/calendly.service';

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

    private umami = inject(UmamiService);
    private calendly = inject(CalendlyService);

    get isContactSalesPlan(): boolean {
        return this.plan.slug === 'enterprise' || this.plan.slug === 'custom';
    }

    onCta(): void {
        if (this.isContactSalesPlan) {
            this.umami.capture(
                `pricing_${this.plan.slug}_contact_enterprise_sales_clicked`,
            );
        } else {
            this.umami.capture(`pricing_${this.plan.slug}_cta_clicked`);
        }
        this.calendly.openDiscoveryPopup();
    }

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

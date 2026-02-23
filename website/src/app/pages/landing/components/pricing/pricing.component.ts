import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import {
    MANUAL_CUSTOM_PLAN,
    PricingPlan,
} from '../../../pricing/pricing.model';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';
import { PricingService } from '@core/services/pricing.service';

@Component({
    selector: 'app-landing-pricing',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, ScrollRevealDirective],
    templateUrl: './pricing.component.html',
    styleUrl: './pricing.component.scss',
})
export class PricingComponent implements OnInit {
    private pricingService = inject(PricingService);
    plans = signal<PricingPlan[]>([]);

    ngOnInit() {
        this.loadPlans();
    }

    private loadPlans() {
        this.pricingService.getPlans().subscribe((apiPlans) => {
            this.plans.set([...apiPlans, MANUAL_CUSTOM_PLAN]);
        });
    }

    formatPrice(cents: number): string {
        if (cents === 0) return '€0';
        return `€${cents / 100}`;
    }
}

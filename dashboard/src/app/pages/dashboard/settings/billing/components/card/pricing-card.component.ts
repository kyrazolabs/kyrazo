import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { PricingPlan } from '../../pricing.model';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';

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
    @Input() isCurrent = false;
    @Input() delay = '';
    @Output() select = new EventEmitter<PricingPlan>();

    displayFeatures = [
        { label: 'Events per second', key: 'limits.eventsPerSecond' },
        {
            label: 'Events per month',
            key: 'limits.eventsPerMonth',
            format: 'number',
        },
        {
            label: 'Max Namespaces',
            key: 'limits.maxNamespaces',
            format: 'unlimited',
        },
        { label: 'Max Members', key: 'limits.maxMembers', format: 'unlimited' },
        { label: 'Data Retention (Days)', key: 'features.retentionDays' },
        { label: 'Ingest Support', key: 'features.ingest', format: 'check' },
        {
            label: 'Dispatch Support',
            key: 'features.dispatch',
            format: 'check',
        },
        { label: 'API Access', key: 'features.apiAccess', format: 'check' },
        {
            label: 'Custom Domain',
            key: 'features.customDomain',
            format: 'check',
        },
        { label: 'SAML/SSO', key: 'features.sso', format: 'check' },
        { label: 'Uptime SLA', key: 'features.sla' },
        { label: 'Support Level', key: 'features.support' },
        {
            label: 'Dedicated Infrastructure',
            key: 'features.dedicatedInfrastructure',
            format: 'check',
        },
        { label: 'Custom SLA', key: 'features.customSla', format: 'check' },
    ];

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

    getValue(key: string): any {
        const keys = key.split('.');
        let value: any = this.plan;
        for (const k of keys) {
            value = value?.[k];
        }
        return value;
    }

    isIncluded(feature: any): boolean {
        const value = this.getValue(feature.key);
        if (
            this.plan.slug === 'custom' &&
            (feature.key === 'limits.eventsPerMonth' ||
                feature.key === 'limits.eventsPerSecond' ||
                feature.key === 'features.retentionDays')
        ) {
            return true;
        }
        if (feature.format === 'check') return !!value;
        if (feature.format === 'unlimited') return value !== 0;
        if (typeof value === 'number') return value > 0;
        return !!value;
    }

    formatFeatureValue(feature: any): string {
        const value = this.getValue(feature.key);

        if (
            this.plan.slug === 'custom' &&
            (feature.key === 'limits.eventsPerMonth' ||
                feature.key === 'limits.eventsPerSecond' ||
                feature.key === 'features.retentionDays')
        ) {
            return 'Custom';
        }

        if (feature.format === 'unlimited' && value === -1) return 'Unlimited';
        if (feature.format === 'number')
            return new Intl.NumberFormat().format(value);
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (value === undefined || value === null || value === 0) return '-';

        return `${value}`;
    }
}

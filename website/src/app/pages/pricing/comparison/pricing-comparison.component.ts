import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PRICING_PLANS, PricingPlan } from '../pricing.model';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';

@Component({
    selector: 'app-pricing-comparison',
    standalone: true,
    imports: [CommonModule, ScrollRevealDirective],
    templateUrl: './pricing-comparison.component.html',
    styleUrl: './pricing-comparison.component.scss',
})
export class PricingComparisonComponent {
    plans: PricingPlan[] = PRICING_PLANS;

    featureGroups = [
        {
            name: 'Performance & Limits',
            features: [
                { label: 'Events per second', key: 'limits.eventsPerSecond' },
                {
                    label: 'Events per month',
                    key: 'limits.eventsPerMonth',
                    format: 'number',
                },
                {
                    label: 'Max Projects',
                    key: 'limits.maxProjects',
                    format: 'unlimited',
                },
                {
                    label: 'Max Members',
                    key: 'limits.maxMembers',
                    format: 'unlimited',
                },
                {
                    label: 'Max Connectors',
                    key: 'limits.maxConnectors',
                    format: 'unlimited',
                },
                {
                    label: 'Max Integrations',
                    key: 'limits.maxIntegrations',
                    format: 'unlimited',
                },
                { label: 'Concurrent Workers', key: 'limits.maxConcurrent' },
            ],
        },
        {
            name: 'Features & Capabilities',
            features: [
                { label: 'Dedicated Workers', key: 'features.workers' },
                {
                    label: 'Data Retention (Days)',
                    key: 'features.retentionDays',
                },
                {
                    label: 'Webhook Retries',
                    key: 'features.webhookRetries',
                    format: 'unlimited',
                },
                {
                    label: 'Custom Headers',
                    key: 'features.customHeaders',
                    format: 'check',
                },
                {
                    label: 'Custom Domain',
                    key: 'features.customDomain',
                    format: 'check',
                },
                {
                    label: 'IP Whitelisting',
                    key: 'features.ipWhitelisting',
                    format: 'check',
                },
                {
                    label: 'Custom Transformations',
                    key: 'features.customTransformations',
                    format: 'check',
                },
                {
                    label: 'Batch Processing',
                    key: 'features.batchProcessing',
                    format: 'check',
                },
                {
                    label: 'API Access',
                    key: 'features.apiAccess',
                    format: 'text',
                },
                { label: 'SAML/SSO', key: 'features.sso', format: 'check' },
            ],
        },
        {
            name: 'Support & Infrastructure',
            features: [
                { label: 'Uptime SLA', key: 'features.sla' },
                { label: 'Support Level', key: 'features.support' },
                {
                    label: 'Dedicated Infrastructure',
                    key: 'features.dedicatedInfrastructure',
                    format: 'check',
                },
                {
                    label: 'Onboarding',
                    key: 'features.onboarding',
                    format: 'text',
                },
                {
                    label: 'Account Manager',
                    key: 'features.accountManager',
                    format: 'check',
                },
            ],
        },
    ];

    getValue(plan: any, key: string): any {
        const keys = key.split('.');
        let value = plan;
        for (const k of keys) {
            value = value?.[k];
        }
        return value;
    }

    formatValue(value: any, format?: string): string {
        if (value === undefined || value === null) return '-';
        if (format === 'unlimited' && value === -1) return 'Unlimited';
        if (format === 'number') return new Intl.NumberFormat().format(value);
        if (format === 'check') return value ? 'check' : 'cross';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        return String(value);
    }
}

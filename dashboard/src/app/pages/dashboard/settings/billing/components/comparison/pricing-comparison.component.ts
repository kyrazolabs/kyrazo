import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PricingPlan } from '../../pricing.model';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';

@Component({
    selector: 'app-pricing-comparison',
    standalone: true,
    imports: [CommonModule, ScrollRevealDirective],
    templateUrl: './pricing-comparison.component.html',
    styleUrl: './pricing-comparison.component.scss',
})
export class PricingComparisonComponent {
    @Input() isYearly = false;
    @Input() plans: PricingPlan[] = [];

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
            ],
        },
        {
            name: 'Features & Capabilities',
            features: [
                { label: 'Dedicated Workers', key: 'features.workers' },
                {
                    label: 'Ingest Support',
                    key: 'features.ingest',
                    format: 'check',
                },
                {
                    label: 'Dispatch Support',
                    key: 'features.dispatch',
                    format: 'check',
                },
                {
                    label: 'Data Retention (Days)',
                    key: 'features.retentionDays',
                },
                {
                    label: 'Custom Headers',
                    key: 'features.customHeaders',
                    format: 'check',
                },
                {
                    label: 'Custom Timeout',
                    key: 'features.customTimeout',
                    format: 'check',
                },
                {
                    label: 'Custom Retries',
                    key: 'features.customRetries',
                    format: 'check',
                },
                {
                    label: 'Forward Configuration',
                    key: 'features.forwardConfiguration',
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
                    format: 'check',
                },
                {
                    label: 'IP Whitelisting',
                    key: 'features.ipWhitelisting',
                    format: 'check',
                },
                {
                    label: 'Header Prefix',
                    key: 'features.whiteLabelHeaders',
                    format: 'check',
                },
                {
                    label: 'Custom Domain',
                    key: 'features.customDomain',
                    format: 'check',
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
                    label: 'Custom SLA',
                    key: 'features.customSla',
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

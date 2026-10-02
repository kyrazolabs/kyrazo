import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PricingPlan } from '../pricing.model';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-pricing-comparison',
    standalone: true,
    imports: [CommonModule, ScrollRevealDirective, TooltipModule],
    templateUrl: './pricing-comparison.component.html',
    styleUrl: './pricing-comparison.component.scss',
})
export class PricingComparisonComponent {
    @Input() isYearly = false;
    @Input() plans: PricingPlan[] = [];

    featureGroups = [
        {
            name: 'Dedicated Infrastructure',
            features: [
                { label: 'Delivery Workers', key: 'features.workers' },
                {
                    label: 'Dedicated Compute & Database',
                    key: 'features.dedicatedInfrastructure',
                    format: 'check',
                },
                {
                    label: 'Isolated Database',
                    key: 'features.isolatedDatabase',
                    format: 'check',
                },
                {
                    label: 'BYOC / Private Cloud',
                    key: 'features.byoc',
                    format: 'check',
                },
                {
                    label: 'Custom Domain',
                    key: 'features.customDomain',
                    format: 'check',
                },
            ],
        },
        {
            name: 'Platform Features',
            features: [
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
                    label: 'Custom Retries',
                    key: 'features.customRetries',
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
                    label: 'Header Prefix',
                    key: 'features.whiteLabelHeaders',
                    format: 'check',
                    tooltip:
                        'Customize outbound event headers. E.g., x-kyrazo-event',
                },
            ],
        },
        {
            name: 'Security, Support & Compliance',
            features: [
                { label: 'Uptime SLA', key: 'features.sla' },
                { label: 'Support Level', key: 'features.support' },
                {
                    label: 'Custom SLA',
                    key: 'features.customSla',
                    format: 'check',
                },
                {
                    label: 'IP Whitelisting',
                    key: 'features.ipWhitelisting',
                    format: 'check',
                },
                { label: 'SAML/SSO', key: 'features.sso', format: 'check' },
                {
                    label: 'Custom Compliance Setup',
                    key: 'features.customCompliance',
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

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface TrustItem {
    title: string;
    description: string;
    icon: string;
    metric?: string;
    category: 'Scalability' | 'Security' | 'Compliance';
}

import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';

@Component({
    selector: 'app-landing-trust',
    standalone: true,
    imports: [CommonModule, ScrollRevealDirective],
    templateUrl: './trust.component.html',
    styles: [],
})
export class TrustComponent {
    items: TrustItem[] = [
        {
            title: 'High Availability Architecture',
            description:
                'Redundant systems and fault-tolerant design help ensure reliable webhook delivery with minimal downtime.',
            icon: 'icon-[hugeicons--database-01]',
            metric: 'Reliability',
            category: 'Scalability',
        },
        {
            title: 'Low-Latency Delivery',
            description:
                'Optimized webhook routing designed to achieve fast delivery times across supported regions.',
            icon: 'icon-[hugeicons--flash]',
            metric: 'Performance',
            category: 'Scalability',
        },
        {
            title: 'Scalable Concurrency',
            description:
                'Handle high volumes of concurrent webhooks using horizontally scalable workers that adapt to load.',
            icon: 'icon-[hugeicons--sparkles]',
            metric: 'Throughput',
            category: 'Scalability',
        },
        {
            title: 'Security Best Practices',
            description:
                'Our platform follows industry-standard security practices for access control, isolation, and data protection.',
            icon: 'icon-[hugeicons--security-lock]',
            category: 'Compliance',
        },
        {
            title: 'GDPR & Privacy-Ready',
            description:
                'Designed to support data protection requirements such as access, deletion, and portability in line with GDPR and similar regulations.',
            icon: 'icon-[hugeicons--legal-01]',
            category: 'Compliance',
        },
        {
            title: 'Encrypted Data Handling',
            description:
                'Webhook data is protected using modern encryption standards during transmission and storage.',
            icon: 'icon-[hugeicons--square-lock-02]',
            category: 'Security',
        },

        // {
        //   title: "Single Sign-On (SSO)",
        //   description:
        //     "Seamless integration with Okta, Azure AD, Google Workspace, and other enterprise identity providers.",
        //   icon: "vpn_key",
        //   category: "Security",
        // },
        // {
        //   title: "Advanced Authentication",
        //   description:
        //     "Support for HMAC signatures, OAuth 2.0, API keys, and custom authentication schemes for maximum security.",
        //   icon: "security",
        //   category: "Security",
        // },
        // {
        //   title: "Granular Access Control",
        //   description:
        //     "Role-based permissions system lets you control exactly who can view, manage, and configure webhooks.",
        //   icon: "groups",
        //   category: "Security",
        // },
    ];
}

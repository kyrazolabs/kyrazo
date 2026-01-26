import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

import { IngestDiagramComponent } from './diagrams/ingest-diagram.component';
import { DispatchDiagramComponent } from './diagrams/dispatch-diagram.component';
import { WorkflowDiagramComponent } from './diagrams/workflow-diagram.component';

import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';

interface TrustItem {
    title: string;
    description: string;
    icon: string;
    metric?: string;
    category: 'Scalability' | 'Security' | 'Compliance';
}

@Component({
    selector: 'app-landing-features',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        IngestDiagramComponent,
        DispatchDiagramComponent,
        WorkflowDiagramComponent,
        ScrollRevealDirective,
    ],
    templateUrl: './features.component.html',
    styleUrl: './features.component.scss',
})
export class FeaturesComponent {
    // Speed Visualizer Data
    speedBars = Array(20).fill(0);
    speedMetric = { value: '1.04s', change: '-22%' };

    // Security Visualizer Data
    securityBits = Array(50).fill(0);
    securityPaths = [
        { d: 'M180,80 C140,80 140,100 100,100' },
        { d: 'M180,90 C140,90 140,100 100,100' },
        { d: 'M180,100 L100,100' },
        { d: 'M180,110 C140,110 140,100 100,100' },
        { d: 'M180,120 C140,120 140,100 100,100' },
        // Through to Left
        { d: 'M100,100 C60,100 60,80 20,80' },
        { d: 'M100,100 C60,100 60,90 20,90' },
        { d: 'M100,100 L20,100' },
        { d: 'M100,100 C60,100 60,110 20,110' },
        { d: 'M100,100 C60,100 60,120 20,120' },
    ];

    // Resilience Visualizer Data
    // Replaced with abstract Regional Health Bars
    resilienceRegions = [
        { label: 'US-EAST', status: 'optimal', value: 100 },
        { label: 'EU-WEST', status: 'optimal', value: 100 },
        { label: 'ASIA-SOUTH', status: 'degraded', value: 92 },
        { label: 'BR-LATAM', status: 'optimal', value: 100 },
    ];

    features = [
        {
            id: 'speed',
            icon: 'pi pi-bolt',
            title: 'Extreme Speed',
            description:
                'Global edge delivery that defies distance. Experience sub-millisecond processing times that keep your real-time applications truly real-time.',
            class: 'md:col-span-1 md:row-span-1',
        },
        {
            id: 'security',
            icon: 'icon-[hugeicons--security-lock]',
            title: 'Hardened Security',
            description:
                'Defense-in-depth architecture. From automated signature verification to end-to-end encryption, we treat every payload as sensitive data.',
            class: 'md:col-span-1 md:row-span-1',
        },
        {
            id: 'resilience',
            icon: 'icon-[hugeicons--globe-02]',
            title: 'Global Resilience',
            description:
                'Uptime you can bet your business on. Our multi-region active-active mesh guarantees delivery even during major provider outages.',
            class: 'md:col-span-1 md:row-span-1',
        },
    ];

    capabilities = [
        {
            title: 'Ingest Events',
            subtitle: 'Secure & Reliable',
            description:
                'Ingest incoming events from any external service (Stripe, GitHub, etc.) via secure endpoints. We handle signature verification for you automatically with zero configuration.',
            icon: 'pi pi-download',
            color: 'text-sky-600 dark:text-sky-500',
            bg: 'border border-sky-500/20 bg-sky-500/10',
            diagram: 'ingest',
            features: [],
        },
        {
            title: 'Dispatch Events',
            subtitle: 'Guaranteed Delivery',
            description:
                'Send events to your customers or internal services. Advanced retry mechanisms and dead-letter queues ensuring nothing gets lost in transit.',
            icon: 'pi pi-send',
            color: 'text-emerald-600 dark:text-emerald-500',
            bg: 'border border-emerald-500/20 bg-emerald-500/10',
            diagram: 'dispatch',
            features: [],
        },
        {
            title: 'Automate Workflows',
            subtitle: 'Smart Connectors',
            description:
                'Automate actions zero-code. Chain tasks, apply filters, and transform data payloads on the fly. Connect Kyrazo to your entire stack—from Slack to custom DBs—with enterprise-grade reliability and Fan-out support.',
            icon: 'icon-[hugeicons--node-view]',
            color: 'text-purple-700 dark:text-purple-500',
            bg: 'bg-purple-500/15 dark:bg-purple-500/10',
            diagram: 'workflow',
            features: [
                'Fan-out Architecture',
                'Payload Transformations',
                'Conditional Logic',
            ],
        },
    ];
    items: TrustItem[] = [
        {
            title: '99.99% Uptime SLA',
            description:
                'Enterprise-grade infrastructure with redundant systems ensures your webhooks are always delivered without interruption.',
            icon: 'dns',
            metric: 'Reliability',
            category: 'Scalability',
        },
        {
            title: 'Sub-Second Latency',
            description:
                'Lightning-fast webhook delivery with P99 latency under 1 second across our global edge network.',
            icon: 'speed',
            metric: 'Performance',
            category: 'Scalability',
        },
        {
            title: 'Massive Concurrency',
            description:
                'Process thousands of webhooks simultaneously with auto-scaling workers that maintain consistent performance under any load.',
            icon: 'bolt',
            metric: 'Throughput',
            category: 'Scalability',
        },
        {
            title: 'SOC 2 Type II Certified',
            description:
                'Independently audited and certified to meet the highest security, availability, and confidentiality standards.',
            icon: 'verified_user',
            category: 'Compliance',
        },
        {
            title: 'GDPR & CCPA Ready',
            description:
                'Full compliance with international data protection regulations, including data portability, deletion, and consent management.',
            icon: 'gavel',
            category: 'Compliance',
        },
        {
            title: 'End-to-End Encryption',
            description:
                'Military-grade AES-256 encryption protects your webhook data both in transit (TLS 1.3) and at rest.',
            icon: 'lock',
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

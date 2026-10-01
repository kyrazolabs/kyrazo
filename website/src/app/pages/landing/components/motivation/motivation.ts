import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';

interface TrustItem {
    title: string;
    description: string;
    icon: string;
    metric?: string;
    category: 'Scalability' | 'Security' | 'Compliance';
}

@Component({
    selector: 'app-landing-motivation',
    imports: [CommonModule, ScrollRevealDirective],
    templateUrl: './motivation.html',
    styleUrl: './motivation.scss',
})
export class Motivation {
    items: TrustItem[] = [
        {
            title: 'Retry Storms & Duplicates',
            description:
                'Handling retries correctly is deceptively hard. Failed deliveries often cause retry storms, duplicated events, and inconsistent downstream state.',
            icon: 'icon-[hugeicons--refresh]',
            metric: 'Reliability',
            category: 'Scalability',
        },

        {
            title: 'Unpredictable Traffic Spikes',
            description:
                'Webhook traffic is bursty by nature. One customer incident can overload workers, queues, or databases without proper backpressure and isolation.',
            icon: 'icon-[hugeicons--chart-up]',
            metric: 'Scaling',
            category: 'Scalability',
        },
        {
            title: 'Timeouts & Partial Failures',
            description:
                'Slow consumers, cold starts, and network hiccups lead to timeouts that are difficult to detect, replay, and recover from safely.',
            icon: 'icon-[hugeicons--clock-01]',
            metric: 'Delivery',
            category: 'Scalability',
        },
        {
            title: 'Signature Verification Pitfalls',
            description:
                'Implementing and rotating webhook signatures securely is error-prone. Small mistakes can expose endpoints to spoofing or replay attacks.',
            icon: 'icon-[hugeicons--security-lock]',
            metric: 'Auth',
            category: 'Security',
        },
        {
            title: 'No Clear Audit Trail',
            description:
                'Without proper logging and immutable event storage, debugging failed or disputed deliveries becomes nearly impossible after the fact.',
            icon: 'icon-[hugeicons--file-01]',
            metric: 'Observability',
            category: 'Compliance',
        },
        {
            title: 'Compliance Gaps',
            description:
                'Data retention, deletion, and access controls are often bolted on late, increasing compliance risk as webhook volume grows.',
            icon: 'icon-[hugeicons--legal-01]',
            metric: 'Risk',
            category: 'Compliance',
        },
    ];
}

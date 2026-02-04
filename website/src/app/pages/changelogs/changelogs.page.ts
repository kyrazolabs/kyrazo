import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineModule } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

interface ChangelogEvent {
    status?: string;
    week: string;
    date: string;
    icon?: string;
    color?: string;
    image?: string;
    title: string;
    description: string;
    type: 'feat' | 'perf' | 'style' | 'fix' | 'chore' | 'refactor' | 'docs';
    changes: string[];
}

@Component({
    selector: 'app-changelogs',
    standalone: true,
    imports: [
        CommonModule,
        TimelineModule,
        CardModule,
        TagModule,
        ButtonModule,
        TooltipModule,
    ],
    templateUrl: './changelogs.page.html',
    styleUrl: './changelogs.page.scss',
})
export class ChangelogsPage {
    events: ChangelogEvent[];

    constructor() {
        this.events = [
            {
                week: 'Week 6',
                date: 'Feb 4, 2026',
                status: 'Released',
                title: 'Feature Expansion & Blog Launch',
                description:
                    'This week we introduced extensive event type suggestions for sources, flexible HTTP methods for dispatching, and launched the Kyrazo blog.',
                type: 'feat',
                changes: [
                    'Dashboard: Added event type suggestions for Stripe, GitHub, Slack, PayPal, Shopify, and Webflow',
                    'Dashboard: Configurable HTTP methods (POST, PUT, PATCH) for targets and endpoints',
                    'Website: Official blog launch with SSR support and CMS integration',
                    'Backend: Support for custom headers and methods in worker dispatch targets',
                    'Security: Sanitized source responses and dedicated authentication update endpoint',
                ],
            },
            {
                week: 'Week 5',
                date: 'Jan 26, 2026',
                status: 'Released',
                title: 'Beta Launch',
                description:
                    'We are excited to announce the official Beta release of Kyrazo. All systems are now online and operational.',
                type: 'feat',
                changes: [
                    'All systems are running stable',
                    'Website: Public beta access enabled',
                    'Dashboard: Comprehensive analytics and management features live',
                    'Runtime: Agent and Worker orchestration fully operational',
                ],
            },
        ];
    }

    getTypeSeverity(
        type: string,
    ):
        | 'success'
        | 'info'
        | 'warn'
        | 'danger'
        | 'secondary'
        | 'contrast'
        | undefined {
        switch (type) {
            case 'feat':
                return 'success';
            case 'fix':
                return 'danger';
            case 'perf':
                return 'warn';
            case 'style':
                return 'info';
            case 'refactor':
            case 'chore':
                return 'secondary';
            default:
                return 'contrast';
        }
    }
}

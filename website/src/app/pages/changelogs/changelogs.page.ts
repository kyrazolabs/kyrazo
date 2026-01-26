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

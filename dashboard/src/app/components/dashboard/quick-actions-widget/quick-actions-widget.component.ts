import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-quick-actions-widget',
    standalone: true,
    imports: [CommonModule, ButtonModule, RouterLink],
    templateUrl: './quick-actions-widget.component.html',
    styleUrl: './quick-actions-widget.component.scss',
})
export class QuickActionsWidgetComponent {
    @Output() actionClick = new EventEmitter<string>();

    actions = [
        {
            id: 'new-project',
            label: 'New Project',
            icon: 'icon-[hugeicons--dashboard-square-01] size-6',
            color: 'text-indigo-500',
            bg: 'bg-indigo-50 dark:bg-indigo-900/10',
            desc: 'Create a new workspace project',
        },
        {
            label: 'New Source',
            icon: 'icon-[hugeicons--live-streaming-02] size-6',
            route: '/events/ingest/sources/create',
            color: 'text-blue-500',
            bg: 'bg-blue-50 dark:bg-blue-900/10',
            desc: 'Connect a new ingest source',
        },
        {
            label: 'New Target',
            icon: 'icon-[hugeicons--target-02] size-6',
            route: '/events/dispatch/targets/create',
            color: 'text-emerald-500',
            bg: 'bg-emerald-50 dark:bg-emerald-900/10',
            desc: 'Add a destination endpoint',
        },
        {
            label: 'New Key',
            icon: 'pi pi-key text-xl!',
            route: '/secrets',
            color: 'text-amber-500',
            bg: 'bg-amber-50 dark:bg-amber-900/10',
            desc: 'Generate API credentials',
        },
    ];

    handleAction(action: any) {
        if (action.route) return; // RouterLink handles it
        if (action.id) {
            this.actionClick.emit(action.id);
        }
    }
}

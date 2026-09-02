import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-dedicated-workers',
    standalone: true,
    imports: [CommonModule, ButtonModule, RouterModule],
    templateUrl: './dedicated-workers.component.html',
    styleUrls: ['./dedicated-workers.component.scss'],
})
export class DedicatedWorkersComponent {
    features = [
        {
            title: 'Physical Isolation',
            description:
                'Your workers run in a dedicated container, completely separated from other tenants. No resource contention, ever.',
            icon: 'icon-[hugeicons--server-03]',
            color: 'text-blue-500',
        },
        {
            title: 'Predictable Latency',
            description:
                'Eliminate P99 spikes caused by noisy neighbors. Your workers serve only your events, independent of other customers.',
            icon: 'icon-[hugeicons--dashboard-speed-01]',
            color: 'text-emerald-500',
        },
        {
            title: 'Independent Scaling',
            description:
                'Scale your worker fleet based on your traffic patterns, not a shared platform’s noisy neighbors.',
            icon: 'icon-[hugeicons--chart-up-01]',
            color: 'text-violet-500',
        },
        {
            title: 'Custom Runtime',
            description:
                'Need specific libraries or longer timeouts? Dedicated workers allow for custom runtime configurations tailored to your workload.',
            icon: 'icon-[hugeicons--settings-03]',
            color: 'text-amber-500',
        },
    ];
}

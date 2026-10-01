import {
    Component,
    OnInit,
    OnDestroy,
    inject,
    signal,
    model,
    viewChild,
    computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerService } from '@core/services/worker.service';
import { WorkerStatus } from '@models/index';
import { Drawer, DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Popover } from 'primeng/popover';
import { SelectButton } from 'primeng/selectbutton';

@Component({
    selector: 'app-worker-status',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DrawerModule,
        ButtonModule,
        BadgeModule,
        TooltipModule,
        TagModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        Select,
        Popover,
        SelectButton,
    ],
    templateUrl: './worker.html',
    styleUrl: './worker.scss',
})
export class WorkerComponent implements OnInit, OnDestroy {
    protected workerService = inject(WorkerService);
    readonly drawerRef = viewChild<Drawer>('drawerRef');

    visible = model(false);
    copied = signal<string | null>(null);

    // Search and Sort
    searchQuery = signal('');
    sortField = signal<string>('status');
    sortOrder = signal<number>(1); // 1 = Asc, -1 = Desc

    sortFieldOptions = [
        {
            label: 'Status',
            value: 'status',
        },
        {
            label: 'Worker ID',
            value: 'worker_id',
        },
        {
            label: 'IP Address',
            value: 'server_ip',
        },
    ];

    sortOrderOptions = [
        { label: 'Asc', value: 1, icon: 'pi pi-sort-amount-up' },
        { label: 'Desc', value: -1, icon: 'pi pi-sort-amount-down' },
    ];

    private statusPriority: Record<string, number> = {
        pending: 1,
        starting: 2,
        running: 3,
        stopping: 4,
        stopped: 5,
        failed: 6,
    };

    filteredWorkers = computed(() => {
        const query = this.searchQuery().toLowerCase().trim();
        let list = this.workerService.workers();

        // Filtering
        if (query) {
            list = list.filter(
                (w) =>
                    w.worker_id.toLowerCase().includes(query) ||
                    w.status.toLowerCase().includes(query) ||
                    w.server_ip.toLowerCase().includes(query) ||
                    (w.server_ipv6 &&
                        w.server_ipv6.toLowerCase().includes(query)),
            );
        }

        // Sorting
        const field = this.sortField();
        const order = this.sortOrder();

        return [...list].sort((a, b) => {
            if (field === 'status') {
                const prioA = this.statusPriority[a.status] || 99;
                const prioB = this.statusPriority[b.status] || 99;
                return (prioA - prioB) * order;
            }

            const valA = (a as any)[field] || '';
            const valB = (b as any)[field] || '';
            return valA.localeCompare(valB) * order;
        });
    });

    setSort(field: string, order: number) {
        this.sortField.set(field);
        this.sortOrder.set(order);
    }

    ngOnInit() {
        this.workerService.acquireWorkerPolling();
    }

    ngOnDestroy() {
        this.workerService.releaseWorkerPolling();
    }

    copyToClipboard(val: string, uniqueId: string) {
        navigator.clipboard.writeText(val);
        this.copied.set(uniqueId);
        setTimeout(() => {
            if (this.copied() === uniqueId) {
                this.copied.set(null);
            }
        }, 1000);
    }

    closeCallback(e: Event): void {
        this.drawerRef()?.close(e);
    }
}

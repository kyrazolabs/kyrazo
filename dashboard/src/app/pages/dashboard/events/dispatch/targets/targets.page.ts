import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

// PrimeNG Imports
import { TableModule, Table, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CardModule } from 'primeng/card';
import { MenuModule } from 'primeng/menu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PaginatorModule } from 'primeng/paginator';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';

// Services and Types
import { ConfirmationService, MessageService } from 'primeng/api';
import { LoaderService } from '@core/services/loader.service';
import { TargetService, ITarget } from '@core/services/target.service';
import { DialogService } from '@shared/services/dialog.service';
import { SentryService } from '@core/3rd-party/sentry';
import { PostHogService } from '@core/3rd-party/posthog';
import { ApiResponse } from '@models/index';
import { CopyIdComponent } from '@shared/components/copy-id/copy-id.component';

@Component({
    selector: 'app-targets.page',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        // PrimeNG Modules
        TableModule,
        SkeletonModule,
        ButtonModule,
        TagModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        CardModule,
        MenuModule,
        ConfirmDialogModule,
        ToastModule,
        TooltipModule,
        ProgressSpinnerModule,
        PaginatorModule,
        ProgressBarModule,
        BadgeModule,
        CopyIdComponent,
    ],
    providers: [TargetService, ConfirmationService, MessageService], // Added providers explicitly if needed, though usually providedIn: root
    templateUrl: './targets.page.html',
    styleUrl: './targets.page.scss',
})
export class TargetsPage implements OnInit {
    @ViewChild('dt') dt!: Table;

    public loader = inject(LoaderService);
    private readonly targetService = inject(TargetService);
    private readonly cs = inject(ConfirmationService);
    private readonly ms = inject(MessageService);
    private readonly router = inject(Router);
    private readonly dialogService = inject(DialogService);
    private readonly sentry = inject(SentryService);
    private readonly posthog = inject(PostHogService);

    constructor(private route: ActivatedRoute) {}

    targets: ITarget[] = [];

    // Pagination properties
    totalRecords = 0;
    rows = 10;
    currentPage = 1;

    // Search and filter properties
    searchQuery = '';
    activeFilter: boolean | undefined = undefined; // undefined = all, true = enabled, false = disabled

    ngOnInit() {
        // Initial load from resolver
        const resolvedData = this.route.snapshot.data['targets'] as ApiResponse<ITarget[]>;
        if (resolvedData) {
            this.targets = resolvedData.data || [];
            this.totalRecords = (resolvedData as any).pagination?.total || this.targets.length;
        } else {
            this.loadTargets();
        }

        this.dialogService.targetSaved$.subscribe(() => {
            this.loadTargets(this.currentPage, this.rows);
        });
    }

    openCreateDialog() {
        this.dialogService.openTargetDialog();
    }

    openEditDialog(id: string) {
        this.dialogService.openTargetDialog(id);
    }

    loadTargets(page: number = 1, limit: number = 10) {
        this.loader.show();

        const queryParams: {
            q?: string;
            enabled?: boolean;
            page?: number;
            limit?: number;
        } = {
            page,
            limit,
            q: this.searchQuery || undefined,
            enabled: this.activeFilter,
        };

        this.targetService
            .getAll(queryParams)
            .pipe(finalize(() => this.loader.hide()))
            .subscribe({
                next: (response) => {
                    this.targets = response.data || [];
                    // Assuming pagination data is in response.pagination, but TargetService.getAll return type signature in prev step said ApiResponse<ITarget[]>
                    // If the backend returns pagination metadata, we should handle it.
                    // Based on Controller: return c.json<GetTargetsResponse> which has pagination.
                    // The Service generic was ApiResponse<ITarget[]> which might be missing pagination type in generic but response has it.
                    // We'll cast simply or access if property exists.
                    // Let's assume response structure matches: { success, message, pagination, data }
                    const pagination = (response as any).pagination;
                    if (pagination) {
                        this.totalRecords = pagination.total;
                    } else {
                        this.totalRecords = this.targets.length;
                    }
                },
                error: (err) => {
                    this.sentry.captureException(err);
                    console.error(err);
                    this.targets = [];
                    this.totalRecords = 0;
                    this.ms.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load targets',
                    });
                },
            });
    }

    loadTargetsLazy(event: TableLazyLoadEvent) {
        const page = event.first! / event.rows! + 1;
        const limit = event.rows!;
        this.rows = limit;
        this.loadTargets(page, limit);
    }

    filterByStatus(status: 'all' | 'active' | 'inactive') {
        if (status === 'all') this.activeFilter = undefined;
        else if (status === 'active') this.activeFilter = true;
        else this.activeFilter = false;

        this.posthog.capture('target_filtered', { status });
        this.loadTargets(1, this.rows);
    }

    onSearchInput(event: any) {
        this.searchQuery = event.target.value;
        if (this.searchQuery.length >= 3) {
            this.posthog.capture('target_searched', {
                query: this.searchQuery,
            });
        }
        this.loadTargets(1, this.rows);
    }

    refreshTargets() {
        this.searchQuery = '';
        this.activeFilter = undefined;
        this.loadTargets();
    }

    // Utility method to format dates
    formatDate(date: string | Date | undefined): string {
        if (!date) return 'Never';
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return (
            dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString()
        );
    }

    toggleStatus(target: ITarget) {
        this.targetService.updateStatus(target.id, !target.enabled).subscribe({
            next: (res) => {
                this.ms.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Target ${target.enabled ? 'enabled' : 'disabled'}`,
                });
                this.posthog.capture('target_updated', {
                    target_id: target.id,
                    enabled: target.enabled,
                    context: 'list_toggle',
                });
            },
            error: (error: any) => {
                this.sentry.captureException(error);
                this.posthog.capture('target_update_error', {
                    target_id: target.id,
                    error: error.message,
                    context: 'list_toggle',
                });
                this.ms.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update status',
                });
            },
        });
    }

    deleteTarget(target: ITarget) {
        this.cs.confirm({
            message: 'Are you sure you want to delete this target?',
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.targetService.delete(target.id).subscribe({
                    next: () => {
                        this.ms.add({
                            severity: 'success',
                            detail: 'Target deleted',
                        });
                        this.posthog.capture('target_deleted', {
                            target_id: target.id,
                        });
                        this.loadTargets(this.currentPage, this.rows);
                    },
                    error: (error: any) => {
                        this.sentry.captureException(error);
                        this.posthog.capture('target_delete_error', {
                            target_id: target.id,
                            error: error.message,
                        });
                        this.ms.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete target',
                        });
                    },
                });
            },
        });
    }
}

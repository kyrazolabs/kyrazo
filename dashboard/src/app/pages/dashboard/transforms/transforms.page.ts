import { Component, ViewChild, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
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

// Services and Types
import { TransformService } from '@core/services/transform.service';
import { ITransform } from '@models/transform.types';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LoaderService } from '@core/services/loader.service';
import { SentryService } from '@core/3rd-party/sentry';
import { PostHogService } from '@core/3rd-party/posthog';
import { DialogService } from '@shared/services/dialog.service';
import { CopyIdComponent } from '@shared/components/copy-id/copy-id.component';

@Component({
    selector: 'app-transforms-page',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
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
        CopyIdComponent,
    ],
    providers: [TransformService],
    templateUrl: './transforms.page.html',
    styleUrl: './transforms.page.scss',
})
export class TransformsPage implements OnInit, OnDestroy {
    @ViewChild('dt') dt!: Table;

    public loader = inject(LoaderService);
    private readonly transformService = inject(TransformService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);
    private readonly sentry = inject(SentryService);
    private readonly posthog = inject(PostHogService);
    private readonly dialogService = inject(DialogService);

    constructor(private route: ActivatedRoute) {}

    transforms: ITransform[] = [];
    filteredTransforms: ITransform[] = [];
    activeFilter: 'all' | 'active' | 'inactive' = 'all';

    totalRecords = 0;
    rows = 10;
    currentPage = 1;

    searchQuery = '';
    private searchTimeout: any;

    ngOnInit() {
        this.dialogService.transformSaved$.subscribe(() => {
            this.refreshTransforms();
        });

        this.loadTransforms();
    }

    ngOnDestroy() {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    }

    loadTransforms(
        page: number = 1,
        limit: number = 10,
        search?: string,
        isActive?: boolean,
    ) {
        this.loader.show();

        const queryParams: any = {
            page,
            limit,
            q: search || '',
        };
        if (isActive !== undefined) queryParams.isActive = isActive;

        this.transformService
            .gets(queryParams)
            .pipe(finalize(() => this.loader.hide()))
            .subscribe({
                next: (response) => {
                    this.transforms = response.data || [];
                    this.totalRecords = response.pagination?.total || this.transforms.length;
                    this.applyClientSideFiltering();
                },
                error: (err) => {
                    this.sentry.captureException(err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load transforms',
                    });
                },
            });
    }

    private applyClientSideFiltering() {
        let filtered = [...this.transforms];

        if (this.activeFilter !== 'all') {
            const active = this.activeFilter === 'active';
            filtered = filtered.filter((t) => t.isActive === active);
        }

        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(
                (t) =>
                    t.name.toLowerCase().includes(query) ||
                    t.description?.toLowerCase().includes(query)
            );
        }

        this.filteredTransforms = filtered;
    }

    loadTransformsLazy(event: TableLazyLoadEvent) {
        const page = event.first! / event.rows! + 1;
        const limit = event.rows!;
        this.loadTransforms(
            page,
            limit,
            this.searchQuery,
            this.activeFilter === 'all' ? undefined : this.activeFilter === 'active'
        );
    }

    filterByStatus(status: 'all' | 'active' | 'inactive') {
        this.activeFilter = status;
        this.loadTransforms(
            1,
            this.rows,
            this.searchQuery,
            status === 'all' ? undefined : status === 'active'
        );
    }

    onSearchInput(event: any) {
        this.searchQuery = event.target.value;
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        if (this.searchQuery.length >= 3 || this.searchQuery.length === 0) {
            this.searchTimeout = setTimeout(() => {
                this.loadTransforms(1, this.rows, this.searchQuery);
            }, 800);
        }
    }

    refreshTransforms() {
        this.searchQuery = '';
        this.activeFilter = 'all';
        this.loadTransforms();
    }

    openCreateDialog() {
        this.dialogService.openTransformDialog();
    }

    openEditDialog(transform: ITransform) {
        this.dialogService.openTransformDialog(transform.id);
    }

    deleteTransform(transform: ITransform) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${transform.name}"?`,
            header: 'Delete Transform',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.transformService.delete(transform.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Transform deleted successfully',
                        });
                        this.loadTransforms();
                    },
                    error: (err) => {
                        this.sentry.captureException(err);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete transform',
                        });
                    },
                });
            },
        });
    }

    toggleStatus(transform: ITransform) {
        const newStatus = !transform.isActive;
        this.transformService.update(transform.id, { isActive: newStatus }).subscribe({
            next: () => {
                transform.isActive = newStatus;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Transform ${newStatus ? 'activated' : 'deactivated'} successfully`,
                });
            },
            error: (err) => {
                this.sentry.captureException(err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update status',
                });
            },
        });
    }

    getStatusSeverity(isActive: boolean): 'success' | 'danger' {
        return isActive ? 'success' : 'danger';
    }
}

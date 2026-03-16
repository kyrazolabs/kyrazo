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

// Services and Types
import { SourceService } from '@core/services/source.service';
import { GetSourcesResponse, SourceStatus } from '@models/source.types';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PaginatorModule } from 'primeng/paginator';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressBarModule } from 'primeng/progressbar';
import { LoaderService } from '@core/services/loader.service';
import { SentryService } from '@core/3rd-party/sentry';
import { PostHogService } from '@core/3rd-party/posthog';
import { DialogService } from '@shared/services/dialog.service';
import { CopyIdComponent } from '@shared/components/copy-id/copy-id.component';

@Component({
    selector: 'app-sources.page',
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
        CopyIdComponent,
    ],
    providers: [SourceService],
    templateUrl: './sources.page.html',
    styleUrl: './sources.page.scss',
})
export class SourcesPage implements OnInit, OnDestroy {
    @ViewChild('dt') dt!: Table;

    public loader = inject(LoaderService);
    private readonly sourceService = inject(SourceService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);
    private readonly sentry = inject(SentryService);
    private readonly posthog = inject(PostHogService);
    private readonly dialogService = inject(DialogService);

    constructor(private route: ActivatedRoute) {}

    sources: GetSourcesResponse[] = [];
    filteredSources: GetSourcesResponse[] = [];
    activeFilter: 'all' | SourceStatus = 'all';

    // Pagination properties
    totalRecords = 0;
    rows = 10;
    currentPage = 1;

    // Search and filter properties
    // Search and filter properties
    searchQuery = '';
    private searchTimeout: any;

    ngOnInit() {
        this.dialogService.sourceSaved$.subscribe(() => {
            this.refreshSources();
        });

        const sources = this.route.snapshot.data[
            'sources'
        ] as GetSourcesResponse[];
        if (sources) {
            this.sources = sources;
            this.totalRecords = sources.length;
            this.applyClientSideFiltering();
        } else {
            this.loadSources();
        }
    }

    ngOnDestroy() {
        // Clean up any pending search timeouts
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    }

    loadSources(
        page: number = 1,
        limit: number = 10,
        search?: string,
        status?: SourceStatus,
    ) {
        this.loader.show();

        const queryParams: {
            q: string;
            status?: SourceStatus;
            page: number;
            limit: number;
        } = {
            page,
            limit,
            q: search || '', // Always include 'q' parameter, even if empty
        };
        if (status) queryParams.status = status;

        this.sourceService
            .gets(queryParams)
            .pipe(finalize(() => this.loader.hide()))
            .subscribe({
                next: (response) => {
                    this.sources = response.data || [];
                    this.totalRecords =
                        response.pagination?.total || this.sources.length;
                    this.applyClientSideFiltering();
                },
                error: (err) => {
                    this.sentry.captureException(err);
                    this.posthog.capture('source_load_error', {
                        error: err.message,
                    });
                    console.error(err);

                    this.sources = [];
                    this.totalRecords = 0;
                },
            });
    }

    private applyClientSideFiltering() {
        let filtered = [...this.sources];

        // Apply status filter
        if (this.activeFilter !== 'all') {
            filtered = filtered.filter(
                (source) => source.status === this.activeFilter,
            );
        }

        // Apply search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(
                (source) =>
                    source.name.toLowerCase().includes(query) ||
                    source.description?.toLowerCase().includes(query) ||
                    source.eventTypes.some((event) =>
                        event.toLowerCase().includes(query),
                    ),
            );
        }

        this.filteredSources = filtered;
    }

    loadSourcesLazy(event: TableLazyLoadEvent) {
        const page = event.first! / event.rows! + 1;
        const limit = event.rows!;
        this.loadSources(
            page,
            limit,
            this.searchQuery,
            this.activeFilter === 'all' ? undefined : this.activeFilter,
        );
    }

    filterByStatus(status: string) {
        this.activeFilter = status as 'all' | SourceStatus;
        this.posthog.capture('source_filtered', { status });
        this.loadSources(
            1,
            this.rows,
            this.searchQuery,
            status === 'all' ? undefined : (status as SourceStatus),
        );
    }

    onSearchInput(event: any) {
        this.searchQuery = event.target.value;

        // Clear any existing timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Only set up debounced search for 3+ characters
        if (this.searchQuery.length >= 3) {
            this.searchTimeout = setTimeout(() => {
                this.performSearch();
            }, 800);
        }
        // Don't trigger any search for empty input or less than 3 characters
    }

    onSearchKeyDown(event: KeyboardEvent) {
        // Trigger search on Enter key when input has 3+ characters
        if (event.key === 'Enter') {
            event.preventDefault();

            if (this.searchQuery.length >= 3) {
                // Clear any pending debounced search and execute immediately
                if (this.searchTimeout) {
                    clearTimeout(this.searchTimeout);
                }
                this.performSearch();
            } else if (
                this.searchQuery.length > 0 &&
                this.searchQuery.length < 3
            ) {
                // Show validation message only when Enter is pressed with insufficient characters
                this.messageService.add({
                    severity: 'info',
                    summary: 'Search Tip',
                    detail: 'Please enter at least 3 characters to search',
                    life: 3000,
                });
            }
            // Don't trigger search for empty input - no action needed
        }
    }

    private performSearch() {
        // Only trigger search when input has 3+ characters
        if (this.searchQuery.length >= 3) {
            this.posthog.capture('source_searched', {
                query: this.searchQuery,
            });
            this.loadSources(
                1,
                this.rows,
                this.searchQuery,
                this.activeFilter === 'all' ? undefined : this.activeFilter,
            );
        }
    }

    toggleSourceStatus(source: GetSourcesResponse) {
        const newStatus: SourceStatus =
            source.status === SourceStatus.ACTIVE
                ? SourceStatus.INACTIVE
                : SourceStatus.ACTIVE;
        const action =
            newStatus === SourceStatus.ACTIVE ? 'activate' : 'deactivate';

        this.confirmationService.confirm({
            message: `Are you sure you want to ${action} this source?`,
            header: `${action.charAt(0).toUpperCase() + action.slice(1)} Source`,
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.updateSourceStatus(source, newStatus);
            },
        });
    }

    private updateSourceStatus(
        source: GetSourcesResponse,
        newStatus: SourceStatus,
    ) {
        const updatePayload = {
            name: source.name,
            description: source.description,
            status: newStatus,
            type: source.type,
            eventTypes: source.eventTypes,
            retryPolicy: source.retryPolicy,
        };

        this.sourceService.update(source.id, updatePayload).subscribe({
            next: (response) => {
                // Update local data
                const index = this.sources.findIndex((s) => s.id === source.id);
                if (index !== -1) {
                    this.sources[index] = {
                        ...this.sources[index],
                        status: newStatus,
                    };
                    this.applyClientSideFiltering();
                }

                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Source ${
                        newStatus === 'active' ? 'activated' : 'deactivated'
                    } successfully`,
                    life: 3000,
                });
                this.posthog.capture('source_updated', {
                    source_id: source.id,
                    new_status: newStatus,
                });
            },
            error: (error) => {
                this.sentry.captureException(error);
                this.posthog.capture('source_update_error', {
                    source_id: source.id,
                    error: error.message,
                });
                console.error('Error updating source status:', error);

                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update source status. Please try again.',
                    life: 5000,
                });
            },
        });
    }

    deleteSource(source: GetSourcesResponse) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${source.name}"? This action cannot be undone.`,
            header: 'Delete Source',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.performDelete(source);
            },
        });
    }

    private performDelete(source: GetSourcesResponse) {
        this.sourceService.delete(source.id).subscribe({
            next: () => {
                this.removeSourceFromLocal(source);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Source deleted successfully',
                    life: 3000,
                });
                this.posthog.capture('source_deleted', {
                    source_id: source.id,
                });
            },
            error: (error) => {
                this.sentry.captureException(error);
                this.posthog.capture('source_delete_error', {
                    source_id: source.id,
                    error: error.message,
                });
                console.error('Error deleting source:', error);

                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to delete source. Please try again.',
                    life: 5000,
                });
            },
        });
    }

    private removeSourceFromLocal(source: GetSourcesResponse) {
        const index = this.sources.findIndex((s) => s.id === source.id);
        if (index !== -1) {
            this.sources.splice(index, 1);
            this.applyClientSideFiltering();
        }
    }

    onPageChange(event: any) {
        this.currentPage = event.page + 1; // PrimeNG uses 0-based indexing
        this.rows = event.rows;
        // If you implement server-side pagination, call loadSources here
        // this.loadSources(this.currentPage);
    }

    refreshSources() {
        // Clear any pending search timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = null;
        }

        this.searchQuery = '';
        this.activeFilter = 'all';
        this.loadSources();
    }

    // Dialog Methods
    openCreateDialog() {
        this.dialogService.openSourceDialog();
    }

    openEditDialog(source: GetSourcesResponse) {
        this.dialogService.openSourceDialog(source.id);
    }

    // Utility method to format dates
    formatDate(date: string | Date): string {
        if (!date) return 'Never';
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return (
            dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString()
        );
    }

    // Utility method to get status severity for tags
    getStatusSeverity(
        status: SourceStatus,
    ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
        switch (status) {
            case 'active':
                return 'success';
            case 'inactive':
                return 'danger';
            case 'paused':
                return 'warn';
            default:
                return 'info';
        }
    }

    // Utility method to format event types
    formatEventTypes(events: string[]): string {
        return events.join(', ');
    }
}

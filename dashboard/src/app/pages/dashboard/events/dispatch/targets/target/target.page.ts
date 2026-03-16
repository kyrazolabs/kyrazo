import {
    AfterViewInit,
    Component,
    ViewChild,
    OnInit,
    inject,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { TableModule, Table, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { DeliveryService } from '@core/services/delivery.service';
import { LoaderService } from '@core/services/loader.service';
import {
    GetDAResponse,
    TargetStatus,
    IDeliveryAttempt,
} from '@models/delivery.types';
import { TargetService, ITarget } from '@core/services/target.service';
import { DialogService } from '@shared/services/dialog.service';
import { SentryService } from '@core/3rd-party/sentry';
import { CopyIdComponent } from '@shared/components/copy-id/copy-id.component';

interface Delivery {
    id: string;
    delivery_id: string;
    endpoint: string;
    endpointName?: string;
    eventType?: string;
    status: string;
    responseCode: string;
    latencyMs?: number;
    attempts?: number;
    timestamp: string;
    webhookId: string;
    webhook_type: string;
    target: string;
    attempt_number?: number;
    processed_at?: string;
    response_time_ms?: number;
    response_code?: number;
}

@Component({
    selector: 'app-target.page',
    standalone: true,
    imports: [
        TagModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule,
        CheckboxModule,
        TooltipModule,
        ProgressSpinnerModule,
        IconFieldModule,
        InputIconModule,
        SkeletonModule,
        ProgressBarModule,
        RouterModule,
        CommonModule,
        FormsModule,
        SelectModule,
        SelectButtonModule,
        ButtonModule,
        CardModule,
        ChartModule,
        TableModule,
        ToastModule,
        CopyIdComponent,
    ],
    providers: [MessageService],
    templateUrl: './target.page.html',
    styleUrl: './target.page.scss',
})
export class TargetPage implements OnInit, AfterViewInit {
    @ViewChild('dt') dt!: Table;

    public loader = inject(LoaderService);
    private readonly deliveryService = inject(DeliveryService);
    private readonly targetService = inject(TargetService);
    private readonly messageService = inject(MessageService);
    private readonly router = inject(Router);
    private readonly dialogService = inject(DialogService);
    private readonly sentry = inject(SentryService);

    targetId: string;
    targetEntity: ITarget | null = null;
    targetUrl: string;

    activeTab: 'overview' | 'details' = 'overview';

    tabOptions = [
        { label: 'Overview', value: 'overview' },
        { label: 'Details', value: 'details' },
    ];

    setActiveTab(tab: 'overview' | 'details') {
        this.activeTab = tab;
    }

    selectedTimeRange = 'last7days';
    timeRangeOptions = [
        { label: 'Last 7 days', value: 'last7days' },
        { label: 'Last 30 days', value: 'last30days' },
        { label: 'Last 90 days', value: 'last90days' },
        { label: 'Last 6 months', value: 'last180days' },
        { label: 'Last year', value: 'last360days' },
    ];

    loadingCharts = true;
    lineChartData: any;
    lineChartOptions: any;
    eventTypesChartData: any;
    eventTypesChartOptions: any;
    statusCodeChartData: any;
    statusCodeChartOptions: any;

    // Core data arrays
    deliveries: IDeliveryAttempt[] = [];
    filteredDeliveries: Delivery[] = [];

    // Stats data
    overview: {
        stats: {
            total_deliveries: number;
            successful_deliveries: number;
            failed_deliveries: number;
            pending_deliveries: number;
            average_delivery_time: number | null;
            success_rate?: number;
        };
        deliveryTrends: {
            day: string;
            target: string;
            successful: number;
            failed: number;
        }[];
        topEventTypes: {
            target: string;
            event_type: string;
            total: number;
            color?: string; // Add optional color property
        }[];
        statusCodeDistribution: {
            target: string;
            response_code: number;
            total: number;
        }[];
    } | null = null;

    // Filter states
    activeFilter: string = 'all';
    selectedStatus: string | undefined;
    searchTerm = '';

    statusOptions = [
        { label: 'Success', value: 'delivered' },
        { label: 'Failed', value: 'failed' },
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Timeout', value: 'timeout' },
        { label: 'Network Error', value: 'network_error' },
    ];

    // Pagination properties
    totalRecords = 0;
    rows = 10;
    currentPage = 1;
    lineShadowPlugin = [
        {
            id: 'lineShadow',
            beforeDatasetDraw(chart: any, args: any) {
                const { ctx } = chart;
                if (args.meta.type === 'line') {
                    const borderColor = args.meta.dataset.options.borderColor;
                    ctx.save();
                    ctx.shadowColor = borderColor || 'rgba(0, 0, 0, 0.15)';
                    ctx.shadowBlur = 10;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 12;
                }
            },
            afterDatasetDraw(chart: any, args: any) {
                const { ctx } = chart;
                if (args.meta.type === 'line') {
                    ctx.restore();
                }
            },
        },
    ];

    private getPrimaryColor(shade: string = '500'): string {
        return (
            getComputedStyle(document.documentElement)
                .getPropertyValue(`--p-primary-${shade}`)
                .trim() || '#3b82f6'
        );
    }

    private isDarkMode(): boolean {
        return document.documentElement.classList.contains('p-dark');
    }

    constructor(private route: ActivatedRoute) {}

    async ngOnInit() {
        this.route.data.subscribe((data) => {
            if (data['target']) {
                this.targetEntity = data['target'];
                this.targetId = this.targetEntity!.id;
                this.targetUrl = this.targetEntity!.url;
                this.loadStats();
                this.loadDeliveries();
            }
        });

        this.dialogService.targetSaved$.subscribe(() => {
            this.loadTargetEntity();
        });
    }

    async loadTargetEntity() {
        this.loader.show();
        this.targetService
            .getOne(this.targetId)
            .pipe(finalize(() => this.loader.hide()))
            .subscribe({
                next: async (response) => {
                    this.targetEntity = response.data;
                    this.targetUrl = this.targetEntity.url;
                    await this.loadStats();
                },
                error: (err) => {
                    console.error(err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load target details',
                    });
                    // Optional: redirect to list
                    // this.router.navigate(['/events/dispatch/targets']);
                },
            });
    }

    openEditDialog() {
        if (this.targetId) {
            this.dialogService.openTargetDialog(this.targetId);
        }
    }

    ngAfterViewInit() {
        // Wait for data to load before manipulating canvas
    }

    initCharts() {
        if (!this.overview) return;
        const isDark = this.isDarkMode();
        const indigo500 = '#6366f1';
        const rose500 = '#f43f5e';
        const emerald500 = '#10b981';
        const amber500 = '#f59e0b';
        const slate500 = '#64748b';
        const primary500 = this.getPrimaryColor('500');

        // Grid colors for light/dark
        const gridColor = isDark
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(15, 23, 42, 0.05)';

        const last30DaysLabels = Array.from({ length: 30 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            return d.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
            });
        });
        const deliveryTrends = this.overview?.deliveryTrends || [];
        const successfulData = deliveryTrends.map((d) => d.successful);
        const failedData = deliveryTrends.map((d) => d.failed);
        const allData = [...successfulData, ...failedData];
        const maxLineValue = allData.length > 0 ? Math.max(...allData) : 0;
        const isMonthly =
            this.selectedTimeRange === 'last180days' ||
            this.selectedTimeRange === 'last360days';

        this.lineChartData = {
            labels: deliveryTrends.map((d) =>
                this.formatDateLabel(d.day, isMonthly),
            ),
            datasets: [
                {
                    label: 'Successful Deliveries',
                    data: successfulData,
                    borderColor: primary500,
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointBackgroundColor: primary500,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    fill: false,
                    borderWidth: 3,
                },
                {
                    label: 'Failed Deliveries',
                    data: failedData,
                    borderColor: rose500,
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointBackgroundColor: rose500,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    fill: false,
                    borderWidth: 3,
                },
            ],
        };

        this.lineChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12,
                        },
                    },
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 12 },
                    bodyFont: { size: 12 },
                    padding: 10,
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: Math.ceil(maxLineValue * 1.05),
                    grid: {
                        display: true,
                        color: gridColor,
                        borderDash: [5, 5],
                        drawTicks: false,
                    },
                    border: { display: false },
                    ticks: {
                        color: slate500,
                        font: { size: 11, weight: '500' },
                        padding: 10,
                    },
                },
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        color: slate500,
                        font: { size: 11, weight: '500' },
                        maxRotation: 0,
                        padding: 10,
                    },
                },
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false,
            },
            elements: {
                line: {
                    tension: 0.5,
                },
                point: {
                    radius: 0, // Default state - no points
                    hoverRadius: 6, // Points appear on hover
                },
            },
            hover: {
                mode: 'index',
                intersect: false,
            },
        };

        // Top Event Types Bar Chart
        const shade500 = this.getPrimaryColor('500');

        this.eventTypesChartData = {
            labels: this.overview.topEventTypes.map((m) => m.event_type),
            datasets: [
                {
                    label: 'Event Count',
                    data: this.overview.topEventTypes.map((m) => m.total),
                    backgroundColor: primary500,
                    borderRadius: 4,
                    borderSkipped: false,
                    barThickness: 32,
                    maxBarThickness: 40,
                },
            ],
        };
        this.eventTypesChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    cornerRadius: 8,
                    padding: 12,
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false,
                    },
                    ticks: {
                        color: '#6b7280',
                        font: { size: 12 },
                    },
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#6b7280',
                        font: { size: 11 },
                        maxRotation: 45,
                    },
                },
            },
        };

        // Status Code Distribution Pie Chart
        const statusCodes = this.overview?.statusCodeDistribution || [];
        this.statusCodeChartData = {
            labels: statusCodes.map((sc) => `${sc.response_code}`),
            datasets: [
                {
                    data: statusCodes.map((sc) => sc.total),
                    backgroundColor: statusCodes.map((sc) =>
                        this.getStatusCodeColor(sc.response_code),
                    ),
                    borderWidth: 0,
                    hoverOffset: 4,
                    borderRadius: 8,
                    spacing: 5,
                },
            ],
        };
        this.statusCodeChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 12 },
                    },
                },
                tooltip: {
                    callbacks: {
                        label: function (context: any) {
                            const total = context.dataset.data.reduce(
                                (a: number, b: number) => a + b,
                                0,
                            );
                            const percentage = (
                                (context.parsed / total) *
                                100
                            ).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        },
                    },
                },
            },
        };

        this.loadingCharts = false;
    }

    onTimeRangeChange() {
        this.loadStats();
    }

    // Convert IDeliveryAttempt to Delivery for display
    private mapToDelivery(da: IDeliveryAttempt): Delivery {
        return {
            id: da.delivery_id,
            delivery_id: da.delivery_id,
            endpoint: da.target_url, // Mapped from target_url
            eventType: da.event_type ? da.event_type : 'Unknown Event',
            status: da.status,
            responseCode: da.response_code ? da.response_code.toString() : '-',
            latencyMs: da.response_time_ms || 0,
            attempts: da.attempt_number,
            timestamp: da.processed_at || da.scheduled_at || '',
            webhookId: da.source_id || '', // Mapped from source_id
            webhook_type: da.source_type || 'unknown', // Mapped from source_type
            target: da.target_url, // Mapped from target_url
            attempt_number: da.attempt_number,
            processed_at: da.processed_at || undefined,
            response_time_ms: da.response_time_ms || undefined,
            response_code: da.response_code || undefined,
        };
    }

    loadDeliveries(
        page: number = 1,
        limit: number = 10,
        search?: string,
        status?: TargetStatus,
    ) {
        if (!this.targetId) return;

        this.loader.show();

        const queryParams: {
            q?: string;
            status?: TargetStatus;
            page?: number;
            limit?: number;
        } = { page, limit };
        if (search) queryParams.q = search;
        if (status) queryParams.status = status;

        // Assuming deliveryService has a gets method similar to webhooks
        this.deliveryService
            .getByTarget(this.targetId, queryParams)
            .pipe(finalize(() => this.loader.hide()))
            .subscribe({
                next: (response) => {
                    this.deliveries = response.data || [];

                    this.totalRecords =
                        Number(response.pagination?.total) ||
                        this.deliveries.length;
                    this.applyClientSideFiltering();
                },
                error: (err) => {
                    console.error(err);
                    this.deliveries = [];
                    this.totalRecords = 0;
                    this.filteredDeliveries = [];
                },
            });
    }
    async loadStats() {
        if (!this.targetId) return;

        return new Promise<void>((resolve) => {
            this.deliveryService
                .getTargetOverview(this.targetId, {
                    days: this.selectedTimeRange,
                })
                .subscribe({
                    next: (response) => {
                        if (response.success && response.data) {
                            this.overview = response.data;
                            const days = this.getDaysFromRange(
                                this.selectedTimeRange,
                            );
                            this.overview.deliveryTrends = this.fillMissingDays(
                                this.overview.deliveryTrends,
                                days,
                            );
                            if (
                                this.selectedTimeRange === 'last180days' ||
                                this.selectedTimeRange === 'last360days'
                            ) {
                                this.overview.deliveryTrends =
                                    this.aggregateByMonth(
                                        this.overview.deliveryTrends,
                                    );
                            }
                            this.initCharts();
                        }
                        resolve();
                    },
                    error: (err) => {
                        console.error('Failed to load delivery stats:', err);
                        this.overview = null;
                        resolve();
                    },
                });
        });
    }

    private applyClientSideFiltering() {
        let filtered = [...this.deliveries];

        // Apply status filter
        if (this.activeFilter !== 'all') {
            filtered = filtered.filter(
                (delivery) =>
                    delivery.status === (this.activeFilter as TargetStatus),
            );
        }

        // Apply search filter
        if (this.searchTerm) {
            const query = this.searchTerm.toLowerCase();
            filtered = filtered.filter(
                (delivery) =>
                    delivery.delivery_id.toLowerCase().includes(query) ||
                    delivery.target_url.toLowerCase().includes(query) ||
                    delivery.event_id.toLowerCase().includes(query) ||
                    (delivery.response_code
                        ?.toString()
                        .toLowerCase()
                        .includes(query) ??
                        false),
            );
        }

        // Convert to display format
        this.filteredDeliveries = filtered.map((da) => this.mapToDelivery(da));
    }

    loadDeliveriesLazy(event: TableLazyLoadEvent) {
        const page = event.first! / event.rows! + 1;
        const limit = event.rows!;
        this.loadDeliveries(
            page,
            limit,
            this.searchTerm,
            this.activeFilter === 'all'
                ? undefined
                : (this.activeFilter as TargetStatus),
        );
    }

    filterByStatus(status: string) {
        this.activeFilter = status as 'all' | TargetStatus;
        this.loadDeliveries(
            1,
            this.rows,
            this.searchTerm,
            status === 'all' ? undefined : (status as TargetStatus),
        );
    }

    onSearchInput(event: any) {
        this.searchTerm = event.target.value;
        this.loadDeliveries(
            1,
            this.rows,
            this.searchTerm,
            this.activeFilter === 'all'
                ? undefined
                : (this.activeFilter as TargetStatus),
        );
    }

    applyFilters() {
        this.activeFilter = this.selectedStatus || 'all';
        this.loadDeliveries(
            1,
            this.rows,
            this.searchTerm,
            this.activeFilter === 'all'
                ? undefined
                : (this.activeFilter as TargetStatus),
        );
    }

    clearFilters() {
        this.selectedStatus = undefined;
        this.searchTerm = '';
        this.activeFilter = 'all';
        this.applyClientSideFiltering();
    }

    hasFilters(): boolean {
        return !!(
            this.selectedStatus ||
            this.searchTerm.trim() ||
            this.activeFilter !== 'all'
        );
    }

    refreshDeliveries() {
        this.selectedStatus = undefined;
        this.searchTerm = '';
        this.activeFilter = 'all';
        this.loadDeliveries();
        this.loadStats();
    }

    retryDelivery(deliveryId: string) {
        console.log('Retrying delivery:', deliveryId);
        // Simulate retry
        const deliveryIndex = this.deliveries.findIndex(
            (d) => d.delivery_id === deliveryId,
        );
        if (deliveryIndex !== -1) {
            this.deliveries[deliveryIndex] = {
                ...this.deliveries[deliveryIndex],
                status: 'pending' as TargetStatus,
                attempt_number:
                    this.deliveries[deliveryIndex].attempt_number + 1,
            };
            this.applyClientSideFiltering();
        }
    }

    onPageChange(event: any) {
        this.currentPage = event.page + 1;
        this.rows = event.rows;
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
        switch (status) {
            case 'delivered':
                return 'success';
            case 'failed':
                return 'danger';
            case 'pending':
                return 'warn';
            case 'processing':
                return 'info';
            case 'timeout':
                return 'warn';
            case 'network_error':
                return 'danger';
            default:
                return 'info';
        }
    }

    formatTimestamp(timestamp: string): string {
        if (!timestamp) return 'Never';
        const dateObj = new Date(timestamp);
        return dateObj.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    }
    // Stats methods using API data
    getTotalCount(): number {
        return this.overview?.stats?.total_deliveries || 0;
    }

    getSuccessCount(): number {
        return this.overview?.stats?.successful_deliveries || 0;
    }

    getFailedCount(): number {
        return this.overview?.stats?.failed_deliveries || 0;
    }

    getSuccessRate(): number {
        return this.overview?.stats?.success_rate || 0;
    }

    getStatusCodeColor(statusCode: number): string {
        if (statusCode >= 200 && statusCode < 300) {
            return '#10b981'; // Emerald-500
        } else if (statusCode >= 300 && statusCode < 400) {
            return '#6366f1'; // Indigo-500
        } else if (statusCode >= 400 && statusCode < 500) {
            return '#f59e0b'; // Amber-500
        } else if (statusCode >= 500) {
            return '#f43f5e'; // Rose-500
        }
        return '#64748b'; // Slate-500
    }

    formatDate(dateString: string): string {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    async copyToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            this.messageService.add({
                severity: 'success',
                summary: 'Copied',
                detail: 'Copied to clipboard',
            });

            // Visual feedback
            this.copyTooltip.set('Copied!');
            this.isCopied.set(true);

            setTimeout(() => {
                this.copyTooltip.set('Copy Secret');
                this.isCopied.set(false);
            }, 2000);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    }

    getDaysFromRange(range: string): number {
        switch (range) {
            case 'last7days':
                return 7;
            case 'last30days':
                return 30;
            case 'last90days':
                return 90;
            case 'last180days':
                return 180;
            case 'last360days':
                return 360;
            default:
                return 7;
        }
    }

    formatDateLabel(dateStr: string, isMonthly: boolean): string {
        if (isMonthly) {
            if (!dateStr.includes('-')) return dateStr;
            const [year, month] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1);
            return date.toLocaleDateString('en-US', {
                month: 'long',
            });
        } else {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            });
        }
    }

    fillMissingDays(deliveryTrends: any[], days: number): any[] {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - days + 1); // Include today

        const dateMap = new Map<string, any>();
        deliveryTrends.forEach((item) => {
            dateMap.set(item.day, item);
        });

        const filled: any[] = [];
        for (
            let d = new Date(startDate);
            d <= today;
            d.setDate(d.getDate() + 1)
        ) {
            const dayStr = d.toISOString().split('T')[0];
            if (dateMap.has(dayStr)) {
                filled.push(dateMap.get(dayStr));
            } else {
                filled.push({
                    workspace_id: deliveryTrends[0]?.workspace_id || '',
                    namespace_id: deliveryTrends[0]?.namespace_id || '',
                    day: dayStr,
                    target: deliveryTrends[0]?.target || '',
                    successful: 0,
                    failed: 0,
                });
            }
        }
        return filled;
    }

    aggregateByMonth(deliveryTrends: any[]): any[] {
        const monthMap = new Map<
            string,
            { successful: number; failed: number; count: number }
        >();
        deliveryTrends.forEach((item) => {
            const date = new Date(item.day);
            const monthKey = `${date.getFullYear()}-${String(
                date.getMonth() + 1,
            ).padStart(2, '0')}`;
            if (!monthMap.has(monthKey)) {
                monthMap.set(monthKey, { successful: 0, failed: 0, count: 0 });
            }
            const monthData = monthMap.get(monthKey)!;
            monthData.successful += item.successful;
            monthData.failed += item.failed;
            monthData.count += 1;
        });

        const aggregated: any[] = [];
        monthMap.forEach((data, monthKey) => {
            aggregated.push({
                workspace_id: deliveryTrends[0]?.workspace_id || '',
                namespace_id: deliveryTrends[0]?.namespace_id || '',
                day: monthKey,
                target: deliveryTrends[0]?.target || '',
                successful: data.successful,
                failed: data.failed,
            });
        });
        return aggregated.sort((a, b) => a.day.localeCompare(b.day));
    }


    // Secret Management
    signingSecret = signal<string | null>(null);
    isSecretVisible = signal<boolean>(false);
    loadingSecret = signal<boolean>(false);
    copyTooltip = signal<string>('Copy Secret');
    isCopied = signal<boolean>(false);

    toggleSecret() {
        if (this.isSecretVisible()) {
            this.isSecretVisible.set(false);
            return;
        }

        if (this.signingSecret()) {
            this.isSecretVisible.set(true);
            return;
        }

        if (!this.targetId) return;

        this.loadingSecret.set(true);
        this.targetService.getSecret(this.targetId).subscribe({
            next: (response) => {
                this.signingSecret.set(response.data);
                this.isSecretVisible.set(true);
                this.loadingSecret.set(false);
            },
            error: (error) => {
                this.sentry.captureException(error);
                console.error('Failed to fetch secret:', error);
                this.loadingSecret.set(false);
            },
        });
    }
}

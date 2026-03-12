import { Component, inject, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Widgets
import { WelcomeWidgetComponent } from '@components/dashboard/welcome-widget.component/welcome-widget.component';
import { QuickActionsWidgetComponent } from '@components/dashboard/quick-actions-widget/quick-actions-widget.component';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';

// Shared Components
import { DialogService } from '@shared/services/dialog.service';

// Services
import { NamespaceService } from '@core/services/namespace.service';
import { SentryService } from '@core/3rd-party/sentry';
import { SubscriptionService } from '@core/services/subscription.service';

@Component({
    selector: 'app-dashboard.page',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        WelcomeWidgetComponent,
        QuickActionsWidgetComponent,
        CardModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        ToastModule,
        TooltipModule,
    ],
    templateUrl: './dashboard.page.html',
    styleUrl: './dashboard.page.scss',
    providers: [MessageService],
})
export class DashboardPage implements OnInit {
    private namespaceService = inject(NamespaceService);
    private messageService = inject(MessageService);
    private sentry = inject(SentryService);
    private dialogService = inject(DialogService);
    public readonly subscriptionService = inject(SubscriptionService);

    // Data
    public namespaces = signal<any[]>([]);
    public totalNamespaces = signal<number>(0);

    // Dialog State
    namespaceDialogVisible = false;
    isCreating = false;

    // Form Data
    namespaceForm = {
        name: '',
        description: '',
    };

    ngOnInit() {
        this.loadNamespaces();
    }

    loadNamespaces() {
        this.namespaceService.getWorkspaceNamespaces().subscribe({
            next: (res) => {
                this.namespaces.set(res.data);
                this.totalNamespaces.set(
                    res.pagination?.total || res.data.length,
                );
            },
            error: (err) => {
                this.sentry.captureException(err);
            },
        });
    }

    // Navigation Cards Configuration
    public navCards = computed(() => {
        const cards = [
            {
                title: 'Ingest',
                subtitle: 'Sources & Events',
                description: 'Manage your data entry points and event sources.',
                icon: 'icon-[hugeicons--inbox-download] size-6',
                color: 'text-blue-500',
                bg: 'bg-blue-50 dark:bg-blue-900/10',
                route: '/events/ingest/sources',
                actionLabel: 'Manage Sources',
                feature: 'ingest' as const,
            },
            {
                title: 'Dispatch',
                subtitle: 'Targets & Delivery',
                description:
                    'Configure destination endpoints and delivery rules.',
                icon: 'icon-[hugeicons--rocket-01] size-6',
                color: 'text-emerald-500',
                bg: 'bg-emerald-50 dark:bg-emerald-900/10',
                route: '/events/dispatch/targets',
                actionLabel: 'Manage Targets',
                feature: 'dispatch' as const,
            },
            {
                title: 'Live Logs',
                subtitle: 'Observability',
                description: 'Track and debug webhook events in real-time.',
                icon: 'icon-[hugeicons--transaction-history] size-6',
                color: 'text-amber-500',
                bg: 'bg-amber-50 dark:bg-amber-900/10',
                route: '/events/dispatch/logs',
                actionLabel: 'View Logs',
                feature: 'dispatch' as const, // Or check either ingest or dispatch
            },
            {
                title: 'Developers',
                subtitle: 'Keys & Docs',
                description: 'Manage API keys and access developer resources.',
                icon: 'pi pi-key text-xl!',
                color: 'text-purple-500',
                bg: 'bg-purple-50 dark:bg-purple-900/10',
                route: '/secrets',
                actionLabel: 'API Settings',
                feature: 'apiAccess' as const,
            },
        ];

        return cards.filter((card) =>
            this.subscriptionService.hasFeature(card.feature)(),
        );
    });

    public isLimitReached = computed(() => {
        const count = this.totalNamespaces();
        const max = this.subscriptionService.getLimit('maxNamespaces')();
        return count >= max;
    });

    handleQuickAction(actionId: string) {
        if (actionId === 'new-namespace') {
            this.openCreateNamespaceDialog();
        }
    }

    openCreateNamespaceDialog() {
        // Check limit
        const max = this.subscriptionService.getLimit('maxNamespaces')();
        // Since we don't have the current namespace count easily available here without fetching it,
        // we might want to just let the backend handle it OR fetch the count.
        // For simplicity and consistency, let's just open the dialog but the create button will be disabled if we had the count.
        // Actually, let's fetch the count if we want to be proactive.
        this.namespaceForm = { name: '', description: '' };
        this.namespaceDialogVisible = true;
    }

    createNamespace() {
        if (!this.namespaceForm.name.trim()) return;

        this.isCreating = true;
        this.namespaceService.create(this.namespaceForm).subscribe({
            next: (response) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Namespace created successfully',
                });
                this.namespaceDialogVisible = false;
                this.isCreating = false;
            },
            error: (err) => {
                this.sentry.captureException(err);
                const errorMessage =
                    err.error?.error?.code === 'LIMIT_EXCEEDED'
                        ? 'Namespace limit reached for your plan.'
                        : 'Failed to create namespace';

                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: errorMessage,
                });
                this.isCreating = false;
            },
        });
    }

    // Support dialog
    openSupportDialog() {
        this.dialogService.openSupportDialog();
    }
}

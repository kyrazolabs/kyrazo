import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { ISubscription } from '@models/billing.types';
import { SubscriptionService } from '@core/services/subscription.service';

// Services
import { NamespaceService } from '@core/services/namespace.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { GetNamespacesResponse, INamespace } from '@models/namespace.types';
import { SentryService } from '@core/3rd-party/sentry';
import { DialogService } from '@shared/services/dialog.service';

@Component({
    selector: 'app-namespaces.page',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        DialogModule,
        ConfirmDialogModule,
        ToastModule,
        TagModule,
        CardModule,
        IconFieldModule,
        InputIconModule,
        TooltipModule,
        MenuModule,
    ],
    templateUrl: './namespaces.page.html',
    styleUrl: './namespaces.page.scss',
    providers: [MessageService, ConfirmationService],
})
export class NamespacesPage implements OnInit {
    private namespaceService = inject(NamespaceService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private sentry = inject(SentryService);
    public subscriptionService = inject(SubscriptionService);
    public dialogService = inject(DialogService);

    namespaces = signal<INamespace[]>([]);
    totalNamespaces = signal<number>(0);
    loading = false;

    isSaving = false;
    isEdit = false;

    // Subscription & Features
    public isLimitReached = computed(() => {
        const max = this.subscriptionService.getLimit('maxNamespaces')();
        return this.totalNamespaces() >= max;
    });

    get hasWhiteLabelFeature(): boolean {
        return this.subscriptionService.hasFeature('whiteLabelHeaders')();
    }

    // Search
    searchQuery = '';

    ngOnInit() {
        this.loadNamespaces();

        // Listen for namespace saved via global dialog
        this.dialogService.namespaceSaved$.subscribe(() => {
            this.loadNamespaces();
        });
    }

    loadNamespaces() {
        this.loading = true;
        this.namespaceService
            .getWorkspaceNamespaces({ q: this.searchQuery })
            .subscribe({
                next: (res) => {
                    this.namespaces.set(res.data);
                    this.totalNamespaces.set(
                        res.pagination?.total || res.data.length,
                    );
                    this.loading = false;
                },
                error: (err) => {
                    this.sentry.captureException(err);
                    this.loading = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load namespaces',
                    });
                },
            });
    }

    onSearch() {
        this.loadNamespaces();
    }

    openNew() {
        this.dialogService.openNamespaceDialog();
    }

    editNamespace(namespace: INamespace) {
        this.dialogService.openNamespaceDialog(namespace.id);
    }

    hideDialog() {
        this.dialogService.closeNamespaceDialog();
    }

    // saveNamespace() removed as it is now handled by NamespaceFormComponent

    deleteNamespace(namespace: INamespace) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete the namespace "${namespace.name}"? This will permanently remove all associated configurations and data.`,
            header: 'Delete Namespace',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.namespaceService.delete(namespace.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Namespace deleted successfully',
                        });
                        this.loadNamespaces();
                    },
                    error: (err) => {
                        this.sentry.captureException(err);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete namespace',
                        });
                    },
                });
            },
        });
    }
}

import { Component, OnInit, inject } from '@angular/core';
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

    namespaces: INamespace[] = [];
    loading = false;

    // Dialog
    namespaceDialog = false;
    namespaceForm: {
        name: string;
        description: string;
        whiteLabelHeaders: string;
        _id?: string;
    } = {
        name: '',
        description: '',
        whiteLabelHeaders: '',
    };
    isSaving = false;
    isEdit = false;

    // Subscription & Features

    get hasWhiteLabelFeature(): boolean {
        return !!this.subscriptionService.subscription()?.planSnapshot?.features
            ?.whiteLabelHeaders;
    }

    // Search
    searchQuery = '';

    ngOnInit() {
        this.loadNamespaces();
    }

    loadNamespaces() {
        this.loading = true;
        this.namespaceService
            .getWorkspaceNamespaces({ q: this.searchQuery })
            .subscribe({
                next: (res) => {
                    this.namespaces = res.data;
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
        this.namespaceForm = {
            name: '',
            description: '',
            whiteLabelHeaders: '',
        };
        this.isEdit = false;
        this.namespaceDialog = true;
    }

    editNamespace(namespace: INamespace) {
        this.namespaceForm = {
            name: namespace.name,
            description: namespace.description || '',
            whiteLabelHeaders: namespace.whiteLabelHeaders || '',
            _id: namespace.id,
        };
        this.isEdit = true;
        this.namespaceDialog = true;
    }

    hideDialog() {
        this.namespaceDialog = false;
        this.isSaving = false;
    }

    saveNamespace() {
        if (!this.namespaceForm.name.trim()) return;

        this.isSaving = true;

        if (this.isEdit && this.namespaceForm._id) {
            // Update
            this.namespaceService
                .update(this.namespaceForm._id, {
                    name: this.namespaceForm.name,
                    description: this.namespaceForm.description,
                    whiteLabelHeaders: this.namespaceForm.whiteLabelHeaders,
                })
                .subscribe({
                    next: (res) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Namespace updated',
                        });
                        this.loadNamespaces();
                        this.hideDialog();
                    },
                    error: (err) => {
                        this.sentry.captureException(err);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to update namespace',
                        });
                        this.isSaving = false;
                    },
                });
        } else {
            // Create
            this.namespaceService
                .create({
                    name: this.namespaceForm.name,
                    description: this.namespaceForm.description,
                    whiteLabelHeaders: this.namespaceForm.whiteLabelHeaders,
                })
                .subscribe({
                    next: (res) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Namespace created',
                        });
                        this.loadNamespaces();
                        this.hideDialog();
                        // Optionally reload window if we want to update topbar list immediately,
                        // but for this page managing its own list, loadNamespaces is enough for the table view.
                        // If topbar sync is critical, we might need a signal or subject in a shared service.
                        // For now, let's just refresh the table.
                    },
                    error: (err) => {
                        this.sentry.captureException(err);
                        const errorMessage =
                            err.error?.error?.code === 'LIMIT_EXCEEDED'
                                ? 'Namespace limit exceeded for your current plan.'
                                : err.error?.error?.message ||
                                  err.message ||
                                  'Failed to create namespace';

                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: errorMessage,
                        });
                        this.isSaving = false;
                    },
                });
        }
    }

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

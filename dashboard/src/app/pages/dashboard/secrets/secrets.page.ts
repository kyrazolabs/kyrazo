import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule,
    FormsModule,
} from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { Dialog } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { MultiSelectModule } from 'primeng/multiselect';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DatePickerModule } from 'primeng/datepicker';
import { KeyService } from '@core/services/key.service';
import { ISecret } from '@models/key.types';
import { SelectItemGroup } from 'primeng/api';
import { LoaderService } from '@core/services/loader.service';
import { finalize } from 'rxjs';
import { DialogService } from '@shared/services/dialog.service';
import { SentryService } from '@core/3rd-party/sentry';
import { SubscriptionService } from '@core/services/subscription.service';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-secrets.page',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        CardModule,
        ButtonModule,
        DatePickerModule,
        AutoCompleteModule,
        TableModule,
        TagModule,
        InputTextModule,
        MultiSelectModule,
        ToastModule,
        ConfirmDialogModule,
        Dialog,
        DividerModule,
        TooltipModule,
    ],
    templateUrl: './secrets.page.html',
    styleUrl: './secrets.page.scss',
})
export class SecretsPage implements OnInit {
    private fb = inject(FormBuilder);
    private kes = inject(KeyService);
    public dialogService = inject(DialogService);

    public loader = inject(LoaderService);
    private sentry = inject(SentryService);
    public subscriptionService = inject(SubscriptionService);

    minDate: Date | undefined;
    showCreateForm = false;
    isCreated = false;
    generatedApiKey = '';
    secretForm: FormGroup;
    secrets: ISecret[] = [];
    selectedSecret: ISecret | null = null;
    showDetailsDialog = false;
    filteredIPs = signal<string[]>([]);

    groupedScopeOptions: SelectItemGroup[] = [
        {
            label: 'Dispatch',
            value: 'dispatch',
            items: [
                { label: 'Dispatch Event', value: 'dispatch:event' },
                { label: 'Dispatch Events', value: 'dispatch:event:batch' },
            ],
        },
        {
            label: 'Dispatch: Targets',
            value: 'target',
            items: [
                { label: 'Create Target', value: 'dispatch:target:create' },
                { label: 'Read Target', value: 'dispatch:target:read' },
                { label: 'Update Target', value: 'dispatch:target:update' },
                { label: 'Delete Target', value: 'dispatch:target:delete' },
                {
                    label: 'Rotate Target Signing Key',
                    value: 'dispatch:target:signing:rotate',
                },
            ],
        },
        {
            label: 'Ingestion: Sources',
            value: 'source',
            items: [
                { label: 'Create Source', value: 'ingest:source:create' },
                { label: 'Read Source', value: 'ingest:source:read' },
                { label: 'Update Source', value: 'ingest:source:update' },
                { label: 'Delete Source', value: 'ingest:source:delete' },
            ],
        },
        {
            label: 'Ingestion: Endpoints',
            value: 'endpoint',
            items: [
                { label: 'Create Endpoint', value: 'ingest:endpoint:create' },
                { label: 'Read Endpoint', value: 'ingest:endpoint:read' },
                { label: 'Update Endpoint', value: 'ingest:endpoint:update' },
                { label: 'Delete Endpoint', value: 'ingest:endpoint:delete' },
            ],
        },
    ];

    get hasIpWhitelistFeature(): boolean {
        return this.subscriptionService.hasFeature('ipWhitelisting')();
    }

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
    ) {
        this.secretForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            scopes: [[], Validators.required],
            ipWhitelist: [[]],
            expiresAt: [''],
        });
    }

    ngOnInit() {
        this.loadSecrets();
        this.minDate = new Date();
        this.minDate.setDate(this.minDate.getDate() + 1);
        this.minDate.setHours(0, 0, 0, 0);
    }

    searchIPs(event: any) {
        this.filteredIPs.set([]);
    }

    getIPLabel(ip: any): string {
        return ip;
    }

    getIPValue(ip: any): any {
        return ip;
    }

    loadSecrets() {
        this.loader.show();
        this.kes
            .gets()
            .pipe(finalize(() => this.loader.hide()))
            .subscribe({
                next: (response) => {
                    this.secrets = response.data.map((s) => ({
                        ...s,
                        masked: true,
                        maskedKey: `••••••••••••••••${s.lastFour}`,
                    }));
                },
                error: (error) => {
                    this.sentry.captureException(error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load secrets',
                    });
                },
            });
    }

    generateKey() {
        if (this.secretForm.invalid) {
            this.secretForm.markAllAsTouched();
            return;
        }

        const formValue = this.secretForm.value;

        const secretData = {
            name: formValue.name,
            scopes: formValue.scopes,
            ipWhitelist: formValue.ipWhitelist,
            expiresAt: formValue.expiresAt || null,
        };

        this.loader.show();
        this.kes
            .create(secretData)
            .pipe(finalize(() => this.loader.hide()))
            .subscribe({
                next: (response) => {
                    const newSecret = response.data;
                    this.secrets.unshift({
                        ...newSecret,
                        masked: true,
                        maskedKey: `****************${newSecret.lastFour}`,
                    });
                    this.generatedApiKey = newSecret.key || '';
                    this.showCreateForm = false;

                    this.secretForm.reset({
                        name: '',
                        scopes: [],
                        ipWhitelist: [],
                        expiresAt: '',
                    });

                    this.messageService.add({
                        severity: 'success',
                        summary: 'API Key Created',
                        detail: 'New API key has been created successfully',
                    });

                    this.dialogService.showMessage('secret', response.data);

                    this.messageService.add({
                        key: 'secret',
                        severity: 'info',
                        summary: 'Secret Created',
                        data: { secret: newSecret.key },
                    });
                },
                error: (error) => {
                    this.sentry.captureException(error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error.message || 'Failed to create API key',
                    });
                },
            });
    }

    closeCreateDialog() {
        this.showCreateForm = false;
        this.isCreated = false;
        this.generatedApiKey = '';
    }

    toggleKeyVisibility(secret: ISecret) {
        secret.masked = !secret.masked;
    }

    copyToClipboard(text: string) {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            this.messageService.add({
                severity: 'info',
                summary: 'Copied',
                detail: 'API key copied to clipboard',
            });
        });
    }

    revokeKey(secret: ISecret) {
        this.confirmationService.confirm({
            message: `Are you sure you want to revoke the key "${secret.name}"? This action cannot be undone.`,
            header: 'Confirm Revocation',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.kes.revoke(secret._id).subscribe({
                    next: () => {
                        this.secrets = this.secrets.filter(
                            (s) => s._id !== secret._id,
                        );
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Key Revoked',
                            detail: 'API key has been revoked successfully',
                        });
                    },
                    error: (error) => {
                        this.sentry.captureException(error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to revoke API key',
                        });
                    },
                });
            },
        });
    }

    viewSecret(secret: ISecret) {
        this.selectedSecret = secret;
        this.showDetailsDialog = true;
    }

    getPermissionLabel(permission: string): string {
        for (const group of this.groupedScopeOptions) {
            const option = group.items.find(
                (opt: any) => opt.value === permission,
            );
            if (option) return (option as any).label || permission;
        }
        return permission;
    }

    getPermissionSeverity(
        permission: string,
    ): 'success' | 'info' | 'warn' | 'danger' {
        if (permission.includes(':read')) return 'success';
        if (permission.includes(':create')) return 'info';
        if (permission.includes(':update')) return 'warn';
        if (permission.includes(':delete') || permission.includes(':rotate'))
            return 'danger';
        return 'info';
    }

    trackByIndex(index: number): number {
        return index;
    }

    getGroupIcon(group: string): string {
        switch (group) {
            case 'dispatch':
                return 'pi pi-send';
            case 'target':
                return 'pi pi-bullseye';
            case 'source':
                return 'pi pi-database';
            case 'endpoint':
                return 'pi pi-sign-in';
            default:
                return 'pi pi-tag';
        }
    }
}

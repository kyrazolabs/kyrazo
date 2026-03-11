import { Component, OnInit, inject, Input, Output, EventEmitter, computed, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { NamespaceService } from '@core/services/namespace.service';
import { SubscriptionService } from '@core/services/subscription.service';
import { DialogService } from '@shared/services/dialog.service';
import { SentryService } from '@core/3rd-party/sentry';
import { INamespace, GetNamespaceResponse } from '@models/namespace.types';

@Component({
    selector: 'app-namespace-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        InputTextModule,
        TextareaModule,
        ButtonModule,
        TooltipModule,
    ],
    templateUrl: './namespace-form.component.html',
})
export class NamespaceFormComponent implements OnInit, OnChanges {
    private namespaceService = inject(NamespaceService);
    private messageService = inject(MessageService);
    private subscriptionService = inject(SubscriptionService);
    protected dialogService = inject(DialogService);
    private sentry = inject(SentryService);

    @Input() namespaceId: string | null = null;
    @Output() onSuccess = new EventEmitter<any>();
    @Output() onCancel = new EventEmitter<void>();

    namespaceForm: {
        name: string;
        description: string;
        whiteLabelHeaders: string;
    } = {
        name: '',
        description: '',
        whiteLabelHeaders: '',
    };

    isSaving = false;
    isEdit = false;
    attemptedSave = false;

    get hasWhiteLabelFeature(): boolean {
        return this.subscriptionService.hasFeature('whiteLabelHeaders')();
    }

    ngOnInit() {
        this.initializeForm();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['namespaceId']) {
            this.initializeForm();
        }
    }

    private initializeForm() {
        this.attemptedSave = false;
        if (this.namespaceId) {
            this.isEdit = true;
            this.loadNamespace();
        } else {
            this.isEdit = false;
            this.namespaceForm = {
                name: '',
                description: '',
                whiteLabelHeaders: '',
            };
        }
    }

    loadNamespace() {
        if (!this.namespaceId) return;
        
        this.namespaceService.get(this.namespaceId).subscribe({
            next: (res: GetNamespaceResponse) => {
                const ns = res.data;
                this.namespaceForm = {
                    name: ns.name,
                    description: ns.description || '',
                    whiteLabelHeaders: ns.whiteLabelHeaders || '',
                };
            },
            error: (err: any) => {
                this.sentry.captureException(err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load namespace details',
                });
                this.onCancel.emit();
            }
        });
    }

    saveNamespace() {
        this.attemptedSave = true;
        if (!this.namespaceForm.name.trim()) return;

        this.isSaving = true;

        if (this.isEdit && this.namespaceId) {
            this.namespaceService
                .update(this.namespaceId, this.namespaceForm)
                .subscribe({
                    next: (res: any) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Namespace updated',
                        });
                        this.onSuccess.emit(res.data);
                        this.isSaving = false;
                    },
                    error: (err: any) => {
                        this.sentry.captureException(err);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to update namespace',
                        });
                        this.isSaving = false;
                    }
                });
        } else {
            this.namespaceService
                .create(this.namespaceForm)
                .subscribe({
                    next: (res) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Namespace created',
                        });
                        this.onSuccess.emit(res.data);
                        this.isSaving = false;
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
                    }
                });
        }
    }
}

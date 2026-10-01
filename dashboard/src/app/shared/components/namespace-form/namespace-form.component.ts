import {
    Component,
    OnInit,
    inject,
    Input,
    Output,
    EventEmitter,
    computed,
    OnChanges,
    SimpleChanges,
    DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { NamespaceService } from '@core/services/namespace.service';
import { SubscriptionService } from '@core/services/subscription.service';
import { DialogService } from '@shared/services/dialog.service';
import { CopyIdComponent } from '@shared/components/copy-id/copy-id.component';
import { SentryService } from '@core/3rd-party/sentry';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    INamespace,
    GetNamespaceResponse,
    NamespaceTransformerData,
} from '@models/namespace.types';
import { CodeEditorComponent } from '@shared/components/code-editor/code-editor.component';

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
        CopyIdComponent,
        CodeEditorComponent,
        ToggleSwitch,
        DividerModule,
    ],
    templateUrl: './namespace-form.component.html',
})
export class NamespaceFormComponent implements OnInit, OnChanges {
    private namespaceService = inject(NamespaceService);
    private messageService = inject(MessageService);
    private subscriptionService = inject(SubscriptionService);
    protected dialogService = inject(DialogService);
    private sentry = inject(SentryService);
    private destroyRef = inject(DestroyRef);

    @Input() namespaceId: string | null = null;
    @Output() onSuccess = new EventEmitter<any>();
    @Output() onCancel = new EventEmitter<void>();

    namespaceForm: {
        name: string;
        description: string;
        whiteLabelHeaders: string;
        useTransformer: boolean;
        transformer: NamespaceTransformerData;
    } = {
        name: '',
        description: '',
        whiteLabelHeaders: '',
        useTransformer: false,
        transformer: {
            code: this.getDefaultTransformerCode(),
        },
    };

    private getDefaultTransformerCode(): string {
        return `/**
 * Namespace Default Transformer
 *
 * Applied to all events in this namespace.
 *
 * @param {Object} payload - The incoming event
 * @return {Object} The transformed payload
 */
return function transform(payload) {
    return payload;
}(payload);`;
    }

    isSaving = false;
    isEdit = false;
    attemptedSave = false;

    get hasWhiteLabelFeature(): boolean {
        return this.subscriptionService.hasFeature('whiteLabelHeaders')();
    }

    ngOnInit() {
        // rely on ngOnChanges for initial setup and subsequent changes
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
                useTransformer: false,
                transformer: {
                    code: this.getDefaultTransformerCode(),
                },
            };
        }
    }

    loadNamespace() {
        if (!this.namespaceId) return;

        this.namespaceService
            .get(this.namespaceId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res: GetNamespaceResponse) => {
                    const ns = res.data;
                    this.namespaceForm = {
                        name: ns.name,
                        description: ns.description || '',
                        whiteLabelHeaders: ns.whiteLabelHeaders || '',
                        useTransformer: !!ns.transformer,
                        transformer: {
                            code:
                                (ns.transformer as any)?.code ||
                                this.getDefaultTransformerCode(),
                            name: (ns.transformer as any)?.name,
                            description: (ns.transformer as any)?.description,
                        },
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
                },
            });
    }

    saveNamespace() {
        this.attemptedSave = true;
        if (!this.namespaceForm.name.trim()) return;

        this.isSaving = true;

        const payload: any = {
            name: this.namespaceForm.name,
            description: this.namespaceForm.description,
            whiteLabelHeaders: this.namespaceForm.whiteLabelHeaders,
        };

        if (this.namespaceForm.useTransformer) {
            payload.transformer = {
                code: this.namespaceForm.transformer.code,
                name: `${this.namespaceForm.name} Default Transformer`,
            };
        } else if (this.isEdit) {
            payload.transformer = null;
        }

        if (this.isEdit && this.namespaceId) {
            this.namespaceService.update(this.namespaceId, payload).subscribe({
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
                },
            });
        } else {
            this.namespaceService.create(payload).subscribe({
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
                },
            });
        }
    }
}

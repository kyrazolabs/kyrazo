import {
    Component,
    inject,
    OnInit,
    signal,
    Input,
    Output,
    EventEmitter,
    OnChanges,
    SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule,
    FormsModule,
} from '@angular/forms';
import { TargetService, ITarget } from '@core/services/target.service';
import { DialogService } from '@shared/services/dialog.service';
import { SentryService } from '@core/3rd-party/sentry';
import { PostHogService } from '@core/3rd-party/posthog';
import { SubscriptionService } from '@core/services/subscription.service';
import { CopyIdComponent } from '@shared/components/copy-id/copy-id.component';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
    selector: 'app-target-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        // PrimeNG Modules
        CardModule,
        InputTextModule,
        ButtonModule,
        InputNumberModule,
        TextareaModule,
        CheckboxModule,
        DividerModule,
        MessageModule,
        SkeletonModule,
        IconFieldModule,
        InputIconModule,
        SelectModule,
        TooltipModule,
        CopyIdComponent,
        FloatLabelModule,
    ],
    templateUrl: './target-form.component.html',
    styleUrls: ['./target-form.component.scss'],
    providers: [TargetService],
})
export class TargetFormComponent implements OnInit, OnChanges {
    private fb = inject(FormBuilder);
    private mes = inject(MessageService);
    private targetService = inject(TargetService);
    public dls = inject(DialogService);
    private sentry = inject(SentryService);
    private posthog = inject(PostHogService);
    public subscriptionService = inject(SubscriptionService);

    public readonly hasCustomHeaders =
        this.subscriptionService.hasFeature('customHeaders');
    public readonly hasCustomTimeout =
        this.subscriptionService.hasFeature('customTimeout');
    public readonly hasCustomRetries =
        this.subscriptionService.hasFeature('customRetries');

    @Input() targetId: string | null = null;
    @Output() onSuccess = new EventEmitter<any>();
    @Output() onCancel = new EventEmitter<void>();

    targetForm: FormGroup;
    loading = signal(false);
    initialLoading = signal(false);
    isEditing = signal(false);
    customHeaders: { key: string; value: string }[] = [{ key: '', value: '' }];

    methodOptions = [
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' },
    ];

    constructor() {
        this.targetForm = this.fb.group({
            name: [
                '',
                [
                    Validators.required,
                    Validators.minLength(3),
                    Validators.maxLength(100),
                ],
            ],
            url: [
                '',
                [Validators.required, Validators.pattern(/https?:\/\/.+/)],
            ],
            method: ['POST', [Validators.required]],
            description: ['', [Validators.maxLength(500)]],
            enabled: [true],
            config: this.fb.group({
                timeout: [
                    5000,
                    [
                        Validators.required,
                        Validators.min(100),
                        Validators.max(60000),
                    ],
                ],
                retryCount: [
                    3,
                    [
                        Validators.required,
                        Validators.min(0),
                        Validators.max(10),
                    ],
                ],
                rateLimit: [null],
            }),
        });
    }

    ngOnInit() {
        if (this.targetId) {
            this.isEditing.set(true);
            this.loadTarget(this.targetId);
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['targetId'] && !changes['targetId'].firstChange) {
            if (this.targetId) {
                this.isEditing.set(true);
                this.loadTarget(this.targetId);
            } else {
                this.isEditing.set(false);
                this.targetForm.reset({
                    enabled: true,
                    config: {
                        timeout: 5000,
                        retryCount: 3,
                        rateLimit: null,
                    },
                });
                this.customHeaders = [{ key: '', value: '' }];
            }
        }
    }

    loadTarget(id: string) {
        this.initialLoading.set(true);
        this.targetService.getOne(id).subscribe({
            next: (response) => {
                const target = response.data;
                this.targetForm.patchValue({
                    name: target.name,
                    url: target.url,
                    method: target.method,
                    description: target.description,
                    enabled: target.enabled,
                    config: target.config,
                });

                if (target.customHeaders) {
                    this.customHeaders = Object.entries(
                        target.customHeaders,
                    ).map(([key, value]) => ({ key, value: String(value) }));
                } else {
                    this.customHeaders = [];
                }
                this.initialLoading.set(false);
            },
            error: (error: any) => {
                this.sentry.captureException(error);
                this.initialLoading.set(false);
                this.mes.add({
                    severity: 'error',
                    summary: 'Failed to load target',
                    detail: error.message,
                    life: 3000,
                });
                this.onCancel.emit();
            },
        });
    }

    addHeader() {
        this.customHeaders.push({ key: '', value: '' });
    }

    removeHeader(index: number) {
        if (this.customHeaders.length > 0) {
            this.customHeaders.splice(index, 1);
        }
    }

    cancel() {
        this.onCancel.emit();
        this.dls.closeTargetDialog();
    }

    onSubmit() {
        if (this.targetForm.invalid) {
            this.targetForm.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        const formValue = this.targetForm.value;

        // Filter out empty headers
        const validHeaders = this.customHeaders.filter(
            (h) => h.key.trim() && h.value.trim(),
        );
        const headersObject = validHeaders.reduce(
            (acc, h) => {
                acc[h.key] = h.value;
                return acc;
            },
            {} as Record<string, string>,
        );

        const payload: Partial<ITarget> = {
            ...formValue,
        };

        // Gate custom headers
        if (this.hasCustomHeaders()) {
            payload.customHeaders = headersObject;
        } else {
            delete payload.customHeaders;
        }

        // Gate config features
        if (payload.config) {
            const config: any = { ...payload.config };

            if (!this.hasCustomTimeout()) {
                delete config.timeout;
            }

            if (!this.hasCustomRetries()) {
                delete config.retryCount;
            }

            // Ensure rateLimit is not sent as null if empty (it's optional)
            if (config.rateLimit === null || config.rateLimit === undefined) {
                delete config.rateLimit;
            }
            payload.config = config;
        }

        const request$ =
            this.isEditing() && this.targetId
                ? this.targetService.update(this.targetId, payload)
                : this.targetService.create(payload);

        request$.subscribe({
            next: (response) => {
                this.loading.set(false);
                this.mes.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Target ${this.isEditing() ? 'updated' : 'created'} successfully`,
                    life: 3000,
                });
                this.onSuccess.emit(response);
                this.posthog.capture(
                    this.isEditing() ? 'target_updated' : 'target_created',
                    {
                        target_id: this.targetId,
                        context: 'dialog',
                    },
                );
                this.dls.closeTargetDialog();
            },
            error: (error: any) => {
                this.loading.set(false);
                this.sentry.captureException(error);
                const errorMessage =
                    error?.error?.error?.message ||
                    error?.error?.message ||
                    'Operation failed. Please try again.';

                this.mes.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: errorMessage,
                    life: 5000,
                });
            },
        });
    }
}

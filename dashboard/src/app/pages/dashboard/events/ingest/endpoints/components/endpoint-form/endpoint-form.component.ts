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
    computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule,
    FormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';

import { EndpointService } from '@core/services/endpoint.service';
import { SubscriptionService } from '@core/services/subscription.service';
import { DialogService } from '@shared/services/dialog.service';
import { IEndpoint } from '@models/endpoint.types';
import { SentryService } from '@core/3rd-party/sentry';
import { PostHogService } from '@core/3rd-party/posthog';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
    selector: 'app-endpoint-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        // PrimeNG Modules
        CardModule,
        TooltipModule,
        InputTextModule,
        SelectModule,
        ButtonModule,
        InputNumberModule,
        TextareaModule,
        CheckboxModule,
        DividerModule,
        MessageModule,
        SkeletonModule,
    ],
    templateUrl: './endpoint-form.component.html',
    styleUrls: ['./endpoint-form.component.scss'],
    providers: [EndpointService],
})
export class EndpointFormComponent implements OnInit, OnChanges {
    private readonly fb = inject(FormBuilder);
    private readonly mes = inject(MessageService);
    private readonly endpointService = inject(EndpointService);
    public readonly dialogService = inject(DialogService);
    public readonly subscriptionService = inject(SubscriptionService);
    private readonly sentry = inject(SentryService);
    private readonly posthog = inject(PostHogService);

    public readonly hasCustomHeaders = computed(() =>
        this.subscriptionService.hasFeature('customHeaders'),
    );
    public readonly hasCustomTimeout = computed(() =>
        this.subscriptionService.hasFeature('customTimeout'),
    );
    public readonly hasCustomRetries = computed(() =>
        this.subscriptionService.hasFeature('customRetries'),
    );

    @Input() endpointId: string | null = null;
    @Output() onSuccess = new EventEmitter<any>();
    @Output() onCancel = new EventEmitter<void>();

    endpointForm: FormGroup;
    loading = signal(false);
    initialLoading = signal(false);
    isEditing = signal(false);
    customHeaders: { key: string; value: string }[] = [{ key: '', value: '' }];

    // Options
    statusOptions = [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
    ];

    methodOptions = [
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' },
    ];

    constructor() {
        this.endpointForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            url: [
                '',
                [Validators.required, Validators.pattern(/^https?:\/\/.+/)],
            ],
            status: ['active'],
            method: ['POST'],
            description: [''],
            timeoutMs: [
                5000,
                [
                    Validators.required,
                    Validators.min(100),
                    Validators.max(30000),
                ],
            ],
            retryCount: [
                3,
                [Validators.required, Validators.min(0), Validators.max(10)],
            ],
            rateLimit: [20],
            enabled: [true],
        });
    }

    ngOnInit() {
        if (this.endpointId) {
            this.isEditing.set(true);
            this.loadEndpoint(this.endpointId);
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['endpointId'] && !changes['endpointId'].firstChange) {
            if (this.endpointId) {
                this.isEditing.set(true);
                this.loadEndpoint(this.endpointId);
            } else {
                this.isEditing.set(false);
                this.endpointForm.reset({
                    status: 'active',
                    method: 'POST',
                    timeoutMs: 5000,
                    retryCount: 3,
                    rateLimit: 20,
                    enabled: true,
                });
                this.customHeaders = [{ key: '', value: '' }];
            }
        }
    }

    loadEndpoint(id: string) {
        this.initialLoading.set(true);
        this.endpointService.get(id).subscribe({
            next: (response) => {
                const endpoint = {
                    ...response.data,
                    timeoutMs: response.data.config.timeout,
                    retryCount: response.data.config.retryCount,
                    rateLimit: response.data.config.rateLimit,
                };
                this.endpointForm.patchValue(endpoint);
                if (response.data.customHeaders) {
                    this.customHeaders = Object.entries(
                        response.data.customHeaders,
                    ).map(([key, value]) => ({ key, value }));
                } else {
                    this.customHeaders = [];
                }
                this.initialLoading.set(false);
            },
            error: (error) => {
                this.sentry.captureException(error);
                this.initialLoading.set(false);
                this.mes.add({
                    severity: 'error',
                    summary: 'Failed to load endpoint',
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
        this.dialogService.closeEndpointDialog();
    }

    trackByIndex(index: number): number {
        return index;
    }

    onSubmit() {
        if (this.endpointForm.invalid) {
            this.endpointForm.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        const formValue = this.endpointForm.value;

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

        const endpointData: Omit<IEndpoint, '_id' | 'userId'> = {
            ...formValue,
            config: {
                timeout: formValue.timeoutMs,
                retryCount: formValue.retryCount,
                rateLimit: formValue.rateLimit,
            },
            customHeaders: headersObject,
        };

        const request$ =
            this.isEditing() && this.endpointId
                ? this.endpointService.update(this.endpointId, endpointData)
                : this.endpointService.create(endpointData);

        request$.subscribe({
            next: (response) => {
                this.loading.set(false);
                this.mes.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Endpoint ${this.isEditing() ? 'updated' : 'created'} successfully`,
                    life: 3000,
                });
                this.onSuccess.emit(response);
                if (this.isEditing()) {
                    this.posthog.capture('endpoint_updated', {
                        endpoint_id: this.endpointId,
                        context: 'dialog',
                    });
                } else {
                    this.posthog.capture('endpoint_created', {
                        method: endpointData.method,
                        context: 'dialog',
                    });
                }
                this.dialogService.closeEndpointDialog();
            },
            error: (error) => {
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

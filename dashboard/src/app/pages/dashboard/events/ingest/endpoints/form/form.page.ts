import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule,
    FormsModule,
} from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { IEndpoint } from '@models/endpoint.types';
import { EndpointService } from '@core/services/endpoint.service';
import { SentryService } from '@core/3rd-party/sentry';
import { PostHogService } from '@core/3rd-party/posthog';

export interface EndpointForm {
    name: string;
    url: string;
    status: 'active' | 'inactive';
    method: string;
    description?: string;
    timeoutMs: number;
    retryCount: number;
    rateLimit?: number;
    headers: { key: string; value: string }[];
    enabled: boolean;
}

@Component({
    selector: 'app-endpoint-form',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        FormsModule,
        // PrimeNG Modules
        CardModule,
        InputTextModule,
        SelectModule,
        ButtonModule,
        InputNumberModule,
        TextareaModule,
        CheckboxModule,
        DividerModule,
        ToastModule,
    ],
    templateUrl: './form.page.html',
    styleUrl: './form.page.scss',
    providers: [EndpointService],
})
export class EndpointFormPage implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private eps = inject(EndpointService);
    private mss = inject(MessageService);
    private sentry = inject(SentryService);
    private posthog = inject(PostHogService);

    endpointId = signal<string>('');
    endpointForm: FormGroup;
    isEdit = false;
    loading = false;
    customHeaders: { key: string; value: string }[] = [{ key: '', value: '' }];

    // PrimeNG Select Options
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
        // Check if we're in edit mode
        const endpointId = this.route.snapshot.paramMap.get('id');
        this.isEdit = !!endpointId;

        if (this.isEdit && endpointId) {
            this.endpointId.set(endpointId);
            this.loadEndpoint(endpointId);
        }
    }

    loadEndpoint(id: string) {
        // In a real app, this would call an API service
        // For demo purposes, we'll simulate loading endpoint data
        this.loading = true;

        this.eps.get(id).subscribe({
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
                this.loading = false;
            },
            error: (error) => {
                this.sentry.captureException(error);
                console.error(error);
            },
        });
    }

    addHeader() {
        this.customHeaders.push({ key: '', value: '' });
    }

    removeHeader(index: number) {
        if (!this.isEdit) {
            if (this.customHeaders.length > 1) {
                this.customHeaders.splice(index, 1);
            }
        } else if (this.isEdit) {
            if (this.customHeaders.length > 0) {
                this.customHeaders.splice(index, 1);
            }
        }
    }

    onSubmit() {
        if (this.endpointForm.invalid) {
            this.endpointForm.markAllAsTouched();
            this.mss.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Please fill in all required fields correctly',
            });
            return;
        }

        this.loading = true;
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

        if (!this.isEdit) {
            this.eps.create(endpointData).subscribe({
                next: (response) => {
                    this.loading = false;
                    console.log(response);

                    this.mss.add({
                        severity: 'success',
                        summary: 'Endpoint created successfully!',
                        life: 4000,
                    });
                    this.posthog.capture('endpoint_created', {
                        method: endpointData.method,
                    });
                },
                error: (error) => {
                    this.sentry.captureException(error);
                    this.posthog.capture('endpoint_creation_error', {
                        method: endpointData.method,
                        error: error.message,
                    });
                    this.loading = false;
                    const errorMessage =
                        error?.error?.error?.message ||
                        error?.error?.message ||
                        'Create failed. Please try again.';

                    this.mss.add({
                        severity: 'error',
                        summary: 'Create Failed',
                        detail: errorMessage,
                        life: 5000,
                    });
                },
            });
        } else if (this.isEdit) {
            this.eps.update(this.endpointId(), endpointData).subscribe({
                next: (response) => {
                    this.loading = false;
                    console.log(response);

                    this.mss.add({
                        severity: 'success',
                        summary: 'Endpoint updated successfully!',
                        life: 4000,
                    });
                    this.posthog.capture('endpoint_updated', {
                        endpoint_id: this.endpointId(),
                        context: 'form',
                    });
                },
                error: (error) => {
                    this.sentry.captureException(error);
                    this.posthog.capture('endpoint_update_error', {
                        endpoint_id: this.endpointId(),
                        error: error.message,
                        context: 'form',
                    });
                    this.loading = false;
                    const errorMessage =
                        error?.error?.error?.message ||
                        error?.error?.message ||
                        'Update failed. Please try again.';

                    this.mss.add({
                        severity: 'error',
                        summary: 'Update Failed',
                        detail: errorMessage,
                        life: 5000,
                    });
                },
            });
        }
    }

    // TrackBy function for better performance
    trackByIndex(index: number): number {
        return index;
    }
}

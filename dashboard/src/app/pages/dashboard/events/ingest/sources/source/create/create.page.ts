import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    FormControl,
    Validators,
    ReactiveFormsModule,
    FormArray,
    FormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { SourceService } from '@core/services/source.service';
import { EndpointService } from '@core/services/endpoint.service';
import { DialogService } from '@shared/services/dialog.service';
import {
    CreateSourceRequest,
    UpdateSourceRequest,
    SourceType,
    SourceStatus,
    backoffStrategy,
    ISource,
} from '@models/source.types';
import { SentryService } from '@core/3rd-party/sentry';
import { PostHogService } from '@core/3rd-party/posthog';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService } from 'primeng/api';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
    selector: 'app-create.page',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,

        // PrimeNG Modules
        CardModule,
        InputTextModule,
        TextareaModule,
        ButtonModule,
        SelectModule,
        ChipModule,
        DividerModule,
        FloatLabelModule,
        IconFieldModule,
        InputIconModule,
        PasswordModule,
        DialogModule,
        MessageModule,
        TooltipModule,
        TooltipModule,
        ToggleSwitch,
        MultiSelectModule,
    ],
    providers: [SourceService],
    templateUrl: './create.page.html',
    styleUrl: './create.page.scss',
})
export class CreatePage implements OnInit {
    private fb = inject(FormBuilder);
    private mes = inject(MessageService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private sourceService = inject(SourceService);
    private dls = inject(DialogService);
    private endpointService = inject(EndpointService);
    private sentry = inject(SentryService);
    private posthog = inject(PostHogService);

    sourceForm: FormGroup;
    loading = signal(false);
    isEditing = signal(false);

    private sourceId: string | null = null;
    sourceType: string | null = null;

    availableEndpoints = signal<any[]>([]); // Store fetched endpoints

    // PrimeNG Select Options
    statusOptions = [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
    ];

    servicesItem = [
        {
            label: 'Paypal',
            value: 'paypal',
            icon: 'icon-[logos--paypal]',
        },
        {
            label: 'Stripe',
            value: 'stripe',
            icon: 'icon-[logos--stripe]',
        },
        {
            label: 'Gitlab',
            value: 'gitlab',
            icon: 'icon-[logos--gitlab-icon]',
        },
        {
            label: 'Github',
            value: 'github',
            icon: 'icon-[logos--github-icon]',
        },
        {
            label: 'Shopify',
            value: 'shopify',
            icon: 'icon-[logos--shopify]',
        },
        {
            label: 'Twilio',
            value: 'twilio',
            icon: 'icon-[logos--twilio-icon]',
        },
        {
            label: 'Intercom',
            value: 'intercom',
            icon: 'icon-[logos--intercom-icon]',
        },
        {
            label: 'Discord',
            value: 'discord',
            icon: 'icon-[logos--discord-icon]',
        },
        {
            label: 'Monday',
            value: 'monday',
            icon: 'icon-[logos--monday-icon]',
        },
        {
            label: 'Mailgun',
            value: 'mailgun',
            icon: 'icon-[logos--mailgun-icon]',
        },
        {
            label: 'OpenAI',
            value: 'openai',
            icon: 'icon-[logos--openai-icon]',
        },
        // ... (rest of items)
        {
            label: 'Twitch',
            value: 'twitch',
            icon: 'icon-[logos--twitch]',
        },
    ];

    constructor() {
        this.sourceForm = this.fb.group({
            name: ['', [Validators.required]],
            description: [''],

            status: [''],
            type: ['receive'], // Fixed to receive type
            service: ['', [Validators.required]], // Service is required for receive

            eventTypes: this.fb.array([this.fb.control('')]),
            showEventTypes: [true],

            forwarding: [false],
            endpoints: [[]], // MultiSelect for endpoints

            authentication: this.fb.group({
                secret: [''],
            }),
        });
    }

    get eventTypesArray() {
        return this.sourceForm.get('eventTypes') as FormArray;
    }

    get secretControl() {
        return this.sourceForm.get('authentication.secret') as FormControl;
    }

    ngOnInit() {
        this.sourceId = this.route.snapshot.paramMap.get('id');
        this.sourceType = this.route.snapshot.paramMap.get('type');
        this.isEditing.set(!!this.sourceId);

        if (this.sourceId) {
            this.loadSource();
        } else if (this.sourceType) {
            // Set the type from route parameter for new sources
            this.sourceForm.patchValue({ type: this.sourceType });
        } else {
            // No type parameter - redirect to type picker
            // this.router.navigate(["/events/ingest/sources/create"]);
        }

        // Set up conditional validation for source secret based on service
        this.sourceForm.get('service')?.valueChanges.subscribe((service) => {
            const secretControl = this.sourceForm.get('authentication.secret');
            if (service && service !== 'general') {
                secretControl?.setValidators([Validators.required]);
            } else {
                secretControl?.clearValidators();
            }
            secretControl?.updateValueAndValidity();
        });

        if (!this.sourceId) {
            this.sourceForm.patchValue({
                status: 'active',
                type: 'receive', // Ensure type is set to receive
            });
        }

        // Load available endpoints
        this.endpointService.gets().subscribe({
            next: (response) => {
                this.availableEndpoints.set(response.data || []);
            },
            error: (err) => {
                this.sentry.captureException(err);
                console.error('Failed to load endpoints', err);
            },
        });
    }

    loadSource() {
        if (!this.sourceId) return;

        this.loading.set(true);
        this.sourceService.get(this.sourceId).subscribe({
            next: (response) => {
                this.populateForm(response.data);
                this.loading.set(false);
            },
            error: (error) => {
                this.sentry.captureException(error);
                this.loading.set(false);
                this.mes.add({
                    severity: 'error',
                    summary: 'Failed to load source',
                    detail: error.message,
                    life: 3000,
                });
                this.goBack();
            },
        });
    }

    populateForm(source: ISource) {
        // Clear existing event types
        while (this.eventTypesArray.length !== 0) {
            this.eventTypesArray.removeAt(0);
        }

        // Add event types
        source.eventTypes.forEach((eventType) => {
            this.eventTypesArray.push(
                this.fb.control(eventType, Validators.required),
            );
        });

        // Patch form values
        this.sourceForm.patchValue({
            name: source.name,
            description: source.description || '',
            status: source.status,
            type: source.type,
            service: source.service,
            forwarding: source.forwarding,
            endpoints: source.endpoints?.map((e) => e._id) || [],
        });

        // Populate authentication if available (though it won't be updated)
        if ((source as any).authentication?.service?.secret) {
            this.sourceForm
                .get('authentication.secret')
                ?.patchValue((source as any).authentication.service.secret);
        }

        // Disable fields that cannot be updated
        this.sourceForm.get('service')?.disable();
        this.sourceForm.get('authentication.secret')?.disable();
    }

    addEventType() {
        this.eventTypesArray.push(this.fb.control('', Validators.required));
    }

    removeEventType(index: number) {
        if (this.eventTypesArray.length > 1) {
            this.eventTypesArray.removeAt(index);
        }
    }

    onSubmit() {
        if (this.sourceForm.invalid) {
            this.sourceForm.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        const formValue = this.sourceForm.value;

        if (this.isEditing()) {
            // Update existing source
            const updateData: UpdateSourceRequest = {
                name: formValue.name,
                description: formValue.description || '',
                status: formValue.status as SourceStatus,
                type: formValue.type as SourceType,
                eventTypes: formValue.eventTypes.filter((et: string) =>
                    et.trim(),
                ),
                forwarding:
                    Array.isArray(formValue.endpoints) &&
                    formValue.endpoints.length > 0
                        ? true
                        : false,
                endpoints: formValue.endpoints,
            };

            this.sourceService.update(this.sourceId!, updateData).subscribe({
                next: () => {
                    this.mes.add({
                        severity: 'success',
                        summary: 'Source updated successfully',
                    });
                    this.posthog.capture('source_updated', {
                        source_id: this.sourceId,
                        context: 'edit_form',
                    });
                    this.goBack();
                },
                error: (error) => {
                    this.sentry.captureException(error);
                    this.posthog.capture('source_update_error', {
                        source_id: this.sourceId,
                        error: error.message,
                        context: 'edit_form',
                    });
                    this.loading.set(false);

                    this.mes.add({
                        severity: 'error',
                        summary: 'Failed to update source',
                        detail: error.message,
                    });
                },
            });
        } else {
            // Create new source - only RECEIVE type is supported
            const createData: CreateSourceRequest = {
                name: formValue.name,
                description: formValue.description || '',
                status: formValue.status as SourceStatus,
                type: SourceType.RECEIVE,
                service: formValue.service,
                forwarding:
                    Array.isArray(formValue.endpoints) &&
                    formValue.endpoints.length > 0
                        ? true
                        : false,
                eventTypes: formValue.eventTypes.filter((et: string) =>
                    et.trim(),
                ),
                endpoints: formValue.endpoints || [], // Map endpoints
                retryPolicy: {
                    maxAttempts: 3,
                    backoffStrategy: backoffStrategy.EXPONENTIAL,
                    interval: 1000,
                },
                authentication:
                    formValue.service !== 'general' &&
                    formValue.authentication?.secret
                        ? {
                              enabled: true,
                              type: 'service',
                              service: {
                                  secret: formValue.authentication.secret,
                              },
                          }
                        : undefined,
            };

            this.sourceService.create(createData).subscribe({
                next: (response) => {
                    this.mes.add({
                        severity: 'success',
                        summary: 'Receive source created successfully',
                    });
                    this.posthog.capture('source_created', {
                        service: createData.service,
                        type: createData.type,
                    });
                    this.dls.showMessage('ingress', response.data);
                    this.router.navigate(['/events/ingest/sources']);
                },
                error: (error) => {
                    this.sentry.captureException(error);
                    this.posthog.capture('source_creation_error', {
                        service: createData.service,
                        error: error.message,
                    });
                    this.loading.set(false);

                    this.mes.add({
                        severity: 'error',
                        summary: 'Failed to create receive source',
                        detail: error.message,
                    });
                },
            });
        }
    }

    goBack() {
        this.router.navigate(['/events/ingest/sources']);
    }
}

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
    FormControl,
    Validators,
    ReactiveFormsModule,
    FormArray,
    FormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';

import { SourceService } from '@core/services/source.service';
import { EndpointService } from '@core/services/endpoint.service';
import { DialogService } from '@shared/services/dialog.service';
import { SubscriptionService } from '@core/services/subscription.service';
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
import { SkeletonModule } from 'primeng/skeleton';
import { AutoCompleteModule } from 'primeng/autocomplete';

import { COMMON_EVENT_TYPES } from './events';

@Component({
    selector: 'app-source-form',
    standalone: true,
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
        ToggleSwitch,
        MultiSelectModule,
        SkeletonModule,
        AutoCompleteModule,
    ],
    providers: [SourceService],
    templateUrl: './source-form.component.html',
    styleUrls: ['./source-form.component.scss'], // Assuming scss file will be created or inline styles
})
export class SourceFormComponent implements OnInit, OnChanges {
    private fb = inject(FormBuilder);
    private mes = inject(MessageService);
    // private router = inject(Router); // Router not needed for navigation back
    private readonly sourceService = inject(SourceService);
    public readonly dialogService = inject(DialogService);
    private readonly endpointService = inject(EndpointService);
    public readonly subscriptionService = inject(SubscriptionService);
    private readonly sentry = inject(SentryService);
    private readonly posthog = inject(PostHogService);

    public readonly hasForwarding =
        this.subscriptionService.hasFeature('forwardConfiguration');

    @Input() sourceId: string | null = null;
    @Input() sourceType: string | null = null; // For default type when creating
    @Output() onSuccess = new EventEmitter<any>();
    @Output() onCancel = new EventEmitter<void>();

    sourceForm: FormGroup;
    loading = signal(false);
    initialLoading = signal(false);
    isEditing = signal(false);
    filteredEventTypes = signal<string[]>([]);

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
            label: 'GitHub',
            value: 'github',
            icon: 'icon-[logos--github-icon]',
        },
        {
            label: 'Shopify',
            value: 'shopify',
            icon: 'icon-[logos--shopify]',
        },
        {
            label: 'Slack',
            value: 'slack',
            icon: 'icon-[logos--slack-icon]',
        },
        {
            label: 'Webflow',
            value: 'webflow',
            icon: 'icon-[logos--webflow]',
        },
    ];

    constructor() {
        this.sourceForm = this.fb.group({
            name: ['', [Validators.required]],
            description: [''],

            status: ['active'], // Default active
            type: ['receive'], // Fixed to receive type
            service: ['', [Validators.required]], // Service is required for receive

            eventTypes: [[]],
            showEventTypes: [true],

            forwarding: [false],
            endpoints: [[]], // MultiSelect for endpoints

            authentication: this.fb.group({
                secret: [''],
            }),
        });
    }

    get eventTypesControl() {
        return this.sourceForm.get('eventTypes') as FormControl;
    }

    get secretControl() {
        return this.sourceForm.get('authentication.secret') as FormControl;
    }

    ngOnInit() {
        // Load available endpoints on init
        this.loadEndpoints();
        this.initializeForm();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['sourceId']) {
            this.isEditing.set(!!this.sourceId);
            if (this.sourceId) {
                this.loadSource();
            } else {
                this.resetForm();
            }
        }
        if (changes['sourceType'] && !this.sourceId) {
            if (this.sourceType) {
                this.sourceForm.patchValue({ type: this.sourceType });
            }
        }
    }

    loadEndpoints() {
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

    initializeForm() {
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

        // Listen for showEventTypes toggle (Legacy logic, keep for safety but can be simplified now)
        this.sourceForm
            .get('showEventTypes')
            ?.valueChanges.subscribe((show) => {
                // No longer need to add empty control for autocomplete
            });
    }

    searchEventTypes(event: any) {
        const query = event.query.toLowerCase();
        const service = this.sourceForm.get('service')?.value;
        const availableTypes = COMMON_EVENT_TYPES[service] || [];

        const filtered = availableTypes.filter((type: string) =>
            type.toLowerCase().includes(query),
        );

        // If no matches and query is not empty, still allow the user to add the custom type
        // (PrimeNG p-autoComplete supports this via its selection logic)
        this.filteredEventTypes.set(filtered);
    }

    resetForm() {
        this.sourceForm.reset({
            name: '',
            description: '',
            status: 'active',
            type: this.sourceType || 'receive',
            service: '',
            forwarding: false,
            endpoints: [],
            eventTypes: [],
            showEventTypes: true,
            authentication: { secret: '' },
        });

        // Re-enable fields that might have been disabled in Edit mode
        this.sourceForm.get('service')?.enable();
        this.sourceForm.get('authentication.secret')?.enable();
    }

    loadSource() {
        if (!this.sourceId) return;

        this.initialLoading.set(true); // Set initial loading
        this.sourceService.get(this.sourceId).subscribe({
            next: (response) => {
                this.populateForm(response.data);
                this.initialLoading.set(false);
            },
            error: (error) => {
                this.sentry.captureException(error);
                this.initialLoading.set(false);
                this.mes.add({
                    severity: 'error',
                    summary: 'Failed to load source',
                    detail: error.message,
                    life: 3000,
                });
                this.onCancel.emit();
            },
        });
    }

    populateForm(source: ISource) {
        // Set showEventTypes based on whether there are event types
        this.sourceForm
            .get('showEventTypes')
            ?.setValue(source.eventTypes?.length > 0);

        // Patch form values
        this.sourceForm.patchValue({
            name: source.name,
            description: source.description || '',
            status: source.status,
            type: source.type,
            service: source.service,
            forwarding: source.forwarding,
            endpoints: source.endpoints?.map((e) => e.id) || [],
            eventTypes: source.eventTypes || [],
        });

        // Disable fields that cannot be updated in Edit mode
        this.sourceForm.get('service')?.disable();
        this.sourceForm.get('authentication.secret')?.disable();

        // If editing, we generally don't show the secret management here as per user request
    }

    addEventType() {}
    removeEventType(index: number) {}

    onSubmit() {
        if (this.sourceForm.invalid) {
            this.sourceForm.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        const formValue = this.sourceForm.getRawValue(); // Use getRawValue to include disabled fields like service

        if (this.isEditing()) {
            // Update existing source
            const updateData: UpdateSourceRequest = {
                name: formValue.name,
                description: formValue.description || '',
                status: formValue.status as SourceStatus,
                type: formValue.type as SourceType,
                eventTypes: formValue.eventTypes
                    ? formValue.eventTypes.filter(
                          (et: string) => et && et.trim(),
                      )
                    : [],
                forwarding:
                    this.hasForwarding() &&
                    Array.isArray(formValue.endpoints) &&
                    formValue.endpoints.length > 0,
                endpoints: this.hasForwarding() ? formValue.endpoints : [],
            };

            this.sourceService.update(this.sourceId!, updateData).subscribe({
                next: () => {
                    this.mes.add({
                        severity: 'success',
                        summary: 'Source updated successfully',
                    });
                    this.posthog.capture('source_updated', {
                        source_id: this.sourceId,
                        context: 'edit_dialog',
                    });
                    this.loading.set(false);
                    this.onSuccess.emit();
                },
                error: (error) => {
                    this.sentry.captureException(error);
                    this.posthog.capture('source_update_error', {
                        source_id: this.sourceId,
                        error: error.message,
                        context: 'edit_dialog',
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
                    this.hasForwarding() &&
                    Array.isArray(formValue.endpoints) &&
                    formValue.endpoints.length > 0,
                endpoints: this.hasForwarding() ? formValue.endpoints || [] : [], // Map endpoints
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
                    // Show ingress info dialog or just finish
                    // this.dls.showMessage('ingress', response.data);
                    this.loading.set(false);
                    this.onSuccess.emit(response.data); // optional pass back data
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

    cancel() {
        this.onCancel.emit();
    }
}

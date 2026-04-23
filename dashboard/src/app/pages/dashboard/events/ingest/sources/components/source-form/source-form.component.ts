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
import { Observable } from 'rxjs';

import { SourceService } from '@core/services/source.service';
import { EndpointService } from '@core/services/endpoint.service';
import { DialogService } from '@shared/services/dialog.service';
import { SubscriptionService } from '@core/services/subscription.service';
import { S3Service } from '@core/services/s3.service';
import { ASQSService } from '@core/services/asqs.service';
import { TransformService } from '@core/services/transform.service';
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
import { CopyIdComponent } from '@shared/components/copy-id/copy-id.component';
import { CodeEditorComponent } from '@shared/components/code-editor/code-editor.component';

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
import { TabsModule } from 'primeng/tabs';
import { SelectButtonModule } from 'primeng/selectbutton';

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
        TabsModule,
        SelectButtonModule,
        CopyIdComponent,
        CodeEditorComponent,
    ],
    providers: [SourceService],
    templateUrl: './source-form.component.html',
    styleUrls: ['./source-form.component.scss'],
})
export class SourceFormComponent implements OnInit, OnChanges {
    private fb = inject(FormBuilder);
    private mes = inject(MessageService);
    private readonly sourceService = inject(SourceService);
    public readonly dialogService = inject(DialogService);
    private readonly endpointService = inject(EndpointService);
    private readonly s3Service = inject(S3Service);
    private readonly asqsService = inject(ASQSService);
    private readonly transformService = inject(TransformService);

    public readonly subscriptionService = inject(SubscriptionService);
    private readonly sentry = inject(SentryService);
    private readonly posthog = inject(PostHogService);

    public readonly hasForwarding = this.subscriptionService.hasFeature(
        'forwardConfiguration',
    );

    @Input() sourceId: string | null = null;
    @Input() sourceType: string | null = null;
    @Output() onSuccess = new EventEmitter<any>();
    @Output() onCancel = new EventEmitter<void>();

    sourceForm: FormGroup;
    loading = signal(false);
    initialLoading = signal(false);
    isEditing = signal(false);
    loadedSource = signal<any | null>(null); // Use any for V2 flexibility
    filteredEventTypes = signal<string[]>([]);
    activeTransformerTab = signal(0);
    transformerTabOptions = [
        { label: 'Editor', value: 0 },
        { label: 'Test & Debug', value: 1 },
    ];

    availableEndpoints = signal<any[]>([]);
    availableS3Buckets = signal<any[]>([]);
    availableASQSQueues = signal<any[]>([]);

    // Transformer Testing State
    testPayload = signal<string>(
        JSON.stringify(
            {
                id: 'evt_test_123',
                type: 'user.signup',
                timestamp: Date.now(),
                data: {
                    object: { id: 'usr_1', email: 'test@kyrazo.com' },
                },
            },
            null,
            2,
        ),
    );
    isTestingTransformer = signal(false);
    testResult = signal<any>(null);
    testResultFormatted = computed(() =>
        this.testResult() ? JSON.stringify(this.testResult(), null, 4) : '',
    );
    testLogs = signal<string[]>([]);
    testExecutionTime = signal<number>(0);

    // PrimeNG Select Options
    statusOptions = [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
    ];

    servicesItem = [
        { label: 'Paypal', value: 'paypal', icon: 'icon-[logos--paypal]' },
        { label: 'Stripe', value: 'stripe', icon: 'icon-[logos--stripe]' },
        { label: 'GitHub', value: 'github', icon: 'icon-[logos--github-icon]' },
        { label: 'Shopify', value: 'shopify', icon: 'icon-[logos--shopify]' },
        { label: 'Slack', value: 'slack', icon: 'icon-[logos--slack-icon]' },
        { label: 'Webflow', value: 'webflow', icon: 'icon-[logos--webflow]' },
    ];

    constructor() {
        this.sourceForm = this.fb.group({
            name: ['', [Validators.required]],
            description: [''],
            status: ['active'],
            type: ['receive'],
            service: ['', [Validators.required]],
            eventTypes: [[]],

            // Managed Transformer
            useTransformer: [false],
            transformer: this.fb.group({
                code: [this.getDefaultTransformerCode()],
            }),

            // V2 Destinations
            destination: this.fb.group({
                endpoints: [[]],
                s3bucket: [[]],
                asqs: [[]],
            }),

            authentication: this.fb.group({
                secret: [''],
            }),
        });

        // Auto-generation of transformer name (implicit in V2 managed)
        // Subscription for automatic selection of newly created dialog items
        this.dialogService.s3Saved$.subscribe((bucket) => {
            this.loadS3Buckets();
            const current =
                this.sourceForm.get('destination.s3bucket')?.value || [];
            this.sourceForm
                .get('destination.s3bucket')
                ?.setValue([...current, bucket.id]);
        });

        this.dialogService.asqsSaved$.subscribe((queue) => {
            this.loadASQSQueues();
            const current =
                this.sourceForm.get('destination.asqs')?.value || [];
            this.sourceForm
                .get('destination.asqs')
                ?.setValue([...current, queue.id]);
        });

        this.dialogService.endpointSaved$.subscribe((endpoint) => {
            this.loadEndpoints();
            const current =
                this.sourceForm.get('destination.endpoints')?.value || [];
            this.sourceForm
                .get('destination.endpoints')
                ?.setValue([...current, endpoint.data.endpoint.id]);
            console.log(JSON.stringify(endpoint));
        });
    }

    private getDefaultTransformerCode(): string {
        return `/**
 * Kyrazo Managed Transformer
 *
 * @param {Object} payload - The incoming event
 * @return {Object} The transformed payload
 */
return function transform(payload) {
    // Write your transformation logic here

    return payload;
}(payload);`;
    }

    ngOnInit() {
        this.loadEndpoints();
        this.loadS3Buckets();
        this.loadASQSQueues();
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
    }

    loadEndpoints() {
        this.endpointService.gets().subscribe({
            next: (response) =>
                this.availableEndpoints.set(response.data || []),
        });
    }

    loadS3Buckets() {
        this.s3Service.gets().subscribe({
            next: (response) =>
                this.availableS3Buckets.set(response.data || []),
        });
    }

    loadASQSQueues() {
        this.asqsService.gets().subscribe({
            next: (response) =>
                this.availableASQSQueues.set(response.data || []),
        });
    }

    initializeForm() {
        this.sourceForm.get('service')?.valueChanges.subscribe((service) => {
            const secretControl = this.sourceForm.get('authentication.secret');
            if (service && service !== 'general') {
                secretControl?.setValidators([Validators.required]);
            } else {
                secretControl?.clearValidators();
            }
            secretControl?.updateValueAndValidity();
        });
    }

    onTransformerTabChange(event: any) {
        if (typeof event === 'number') {
            this.activeTransformerTab.set(event);
        }
    }

    searchEventTypes(event: any) {
        const query = event.query.toLowerCase();
        const service = this.sourceForm.get('service')?.value;
        const availableTypes = COMMON_EVENT_TYPES[service] || [];
        this.filteredEventTypes.set(
            availableTypes.filter((type: string) =>
                type.toLowerCase().includes(query),
            ),
        );
    }

    resetForm() {
        this.sourceForm.reset({
            name: '',
            description: '',
            status: 'active',
            type: this.sourceType || 'receive',
            service: '',
            eventTypes: [],
            useTransformer: false,
            transformer: { code: this.getDefaultTransformerCode() },
            destination: { endpoints: [], s3bucket: [], asqs: [] },
            authentication: { secret: '' },
        });
        this.sourceForm.get('service')?.enable();
        this.sourceForm.get('authentication.secret')?.enable();
        this.testResult.set(null);
        this.testLogs.set([]);
    }

    loadSource() {
        if (!this.sourceId) return;
        this.initialLoading.set(true);
        this.sourceService.getV2(this.sourceId).subscribe({
            next: (response) => {
                this.loadedSource.set(response.data);
                this.populateForm(response.data);
                this.initialLoading.set(false);
            },
            error: (error: any) => {
                this.sentry.captureException(error);
                this.initialLoading.set(false);
                this.mes.add({
                    severity: 'error',
                    summary: 'Failed to load source',
                    detail: error.message,
                });
                this.onCancel.emit();
            },
        });
    }

    populateForm(source: any) {
        this.sourceForm.patchValue({
            name: source.name,
            description: source.description || '',
            status: source.status,
            type: source.type,
            service: source.service,
            eventTypes: source.eventTypes || [],
            useTransformer: !!source.transformer,
            transformer: {
                code:
                    (source.transformer &&
                    typeof source.transformer === 'object'
                        ? source.transformer.code
                        : source.transformer) ||
                    this.getDefaultTransformerCode(),
            },
            destination: {
                endpoints: (
                    source.destination?.endpoints ||
                    source.endpoints ||
                    []
                ).map((e: any) => e.id || e),
                s3bucket: (source.destination?.s3bucket || []).map(
                    (e: any) => e.id || e,
                ),
                asqs: (source.destination?.asqs || []).map(
                    (e: any) => e.id || e,
                ),
            },
        });

        this.sourceForm.get('service')?.disable();
        this.sourceForm.get('authentication.secret')?.disable();
    }

    onTestTransformer() {
        let payload: any;
        try {
            payload = JSON.parse(this.testPayload());
        } catch (e) {
            this.mes.add({
                severity: 'error',
                summary: 'Invalid JSON',
                detail: 'Test payload must be valid JSON',
            });
            return;
        }

        this.isTestingTransformer.set(true);
        this.transformService
            .test({
                code: this.sourceForm.get('transformer.code')?.value,
                payload,
            })
            .subscribe({
                next: (response) => {
                    this.testResult.set(response.data.result);
                    this.testLogs.set(response.data.logs);
                    this.testExecutionTime.set(
                        Number(response.data.executionTimeMs.toFixed(4)),
                    );
                    this.isTestingTransformer.set(false);
                },
                error: (err) => {
                    this.isTestingTransformer.set(false);
                    this.mes.add({
                        severity: 'error',
                        summary: 'Test Failed',
                        detail:
                            err.error?.message || 'Error occurred during test',
                    });
                },
            });
    }

    onSubmit() {
        if (this.sourceForm.invalid) {
            this.sourceForm.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        const formValue = this.sourceForm.getRawValue();

        const data: any = {
            name: formValue.name,
            description: formValue.description || '',
            status: formValue.status,
            type: formValue.type,
            service: formValue.service,
            eventTypes: (formValue.eventTypes || []).filter(
                (et: string) => et && et.trim(),
            ),
            destination: formValue.destination,
        };

        // Add transformer if enabled
        if (formValue.useTransformer) {
            data.transformer = {
                name: `${formValue.name} Transformer`,
                code: formValue.transformer.code,
            };
        } else if (this.isEditing() && this.loadedSource()?.transformer) {
            // If it was enabled but now disabled, we need a way to tell the backend to unlink
            data.transformer = null;
        }

        if (!this.isEditing()) {
            data.retryPolicy = {
                maxAttempts: 3,
                backoffStrategy: backoffStrategy.EXPONENTIAL,
                interval: 1000,
            };
            if (
                formValue.service !== 'general' &&
                formValue.authentication?.secret
            ) {
                data.authentication = {
                    enabled: true,
                    type: 'service',
                    service: { secret: formValue.authentication.secret },
                };
            }
        }

        const request: Observable<any> = this.isEditing()
            ? this.sourceService.updateV2(this.sourceId!, data)
            : this.sourceService.createV2(data);

        request.subscribe({
            next: (response: any) => {
                this.mes.add({
                    severity: 'success',
                    summary: `Source ${this.isEditing() ? 'updated' : 'created'} successfully`,
                });
                this.loading.set(false);
                this.onSuccess.emit(response.data);
            },
            error: (error: any) => {
                this.sentry.captureException(error);
                this.loading.set(false);
                this.mes.add({
                    severity: 'error',
                    summary: 'Operation Failed',
                    detail: error.message,
                });
            },
        });
    }

    openEndpointDialog() {
        this.dialogService.openEndpointDialog();
    }

    openS3Dialog() {
        this.dialogService.openS3Dialog();
    }

    openASQSDialog() {
        this.dialogService.openASQSDialog();
    }

    cancel() {
        this.onCancel.emit();
    }
}

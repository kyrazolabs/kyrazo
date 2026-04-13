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
import { TransformService } from '@core/services/transform.service';
import { DialogService } from '@shared/services/dialog.service';
import { ITransform, ITransformVersion } from '@models/transform.types';
import { SentryService } from '@core/3rd-party/sentry';
import { MessageService } from 'primeng/api';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { CodeEditorComponent } from '@shared/components/code-editor/code-editor.component';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

@Component({
    selector: 'app-transform-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        CardModule,
        InputTextModule,
        TextareaModule,
        ButtonModule,
        DividerModule,
        ToggleSwitch,
        SkeletonModule,
        ProgressBarModule,
        TabsModule,
        CodeEditorComponent,
        TagModule,
    ],
    templateUrl: './transform-form.component.html',
    styleUrls: ['./transform-form.component.scss'],
})
export class TransformFormComponent implements OnInit, OnChanges {
    private fb = inject(FormBuilder);
    private mes = inject(MessageService);
    private transformService = inject(TransformService);
    public dialogService = inject(DialogService);
    private sentry = inject(SentryService);

    @Input() transformId: string | null = null;
    @Output() onSuccess = new EventEmitter<any>();
    @Output() onCancel = new EventEmitter<void>();

    transformForm: FormGroup;
    loading = signal(false);
    initialLoading = signal(false);
    isEditing = signal(false);
    versions = signal<ITransformVersion[]>([]);
    expandedVersionIndex = signal<number | null>(null);
    currentVersion = signal<number | null>(null);

    toggleVersion(index: number): void {
        this.expandedVersionIndex.set(
            this.expandedVersionIndex() === index ? null : index,
        );
    }

    get jsonEditorOptions(): 'json' {
        return 'json';
    }

    // Testing State
    testPayload = signal<string>(
        JSON.stringify(
            {
                id: 'evt_01j7p3v9qf8z7x4m',
                type: 'user.created',
                timestamp: 1711564800,
                data: {
                    object: {
                        id: 'usr_99',
                        email: 'alex@example.com',
                        plan: 'pro',
                    },
                    previous: null,
                },
            },
            null,
            2,
        ),
    );
    testResult = signal<any>(null);
    testResultFormatted = computed(() => this.testResult() ? JSON.stringify(this.testResult(), null, 2) : '');
    testLogs = signal<string[]>([]);
    testExecutionTime = signal<number>(0);
    isTesting = signal(false);

    constructor() {
        this.transformForm = this.fb.group({
            name: ['', [Validators.required]],
            description: [''],
            code: [
                `/**
 * Kyrazo Transformer
 *
 * Available Utilities:
 * - _ (lodash): Advanced data manipulation
 * - dayjs: Comprehensive date/time management
 * - crypto: secure hashing via crypto.hmac(key, data) or crypto.sha256(data)
 * - console: Debug using console.log() in the "Test & Debug" tab
 *
 * @param {Object} payload - The incoming event
 * @param {string} payload.id - Unique event identifier (Static)
 * @param {string} payload.type - Human-readable event name (Static)
 * @param {number} payload.timestamp - Epoch timestamp (Static)
 * @param {Object} payload.data - The actual event payload (Customizable)
 */

// 1. Extract and transform your data
const originalData = payload.data;
const transformedData = {
    ...originalData,
    // Add custom fields or modify existing ones here
    processed_at: dayjs().toISOString(),
    env: 'production'
};

// 2. Return the final payload
// Note: id, type, and timestamp are typically kept as-is
return {
    ...payload,
    data: transformedData
};`,
                [Validators.required],
            ],
            isActive: [true],
        });
    }

    ngOnInit() {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes['transformId']) {
            this.isEditing.set(!!this.transformId);
            if (this.transformId) {
                this.loadTransform();
                this.loadVersions();
            } else {
                this.resetForm();
            }
        }
    }

    loadTransform() {
        if (!this.transformId) return;
        this.initialLoading.set(true);
        this.transformService.get(this.transformId).subscribe({
            next: (response) => {
                const transform = response.data;
                this.currentVersion.set(transform.currentVersion);
                this.transformForm.patchValue({
                    name: transform.name,
                    description: transform.description || '',
                    code: transform.code,
                    isActive: transform.isActive,
                });
                this.initialLoading.set(false);
            },
            error: (err) => {
                this.sentry.captureException(err);
                this.mes.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load transform',
                });
                this.initialLoading.set(false);
            },
        });
    }

    loadVersions() {
        if (!this.transformId) return;
        this.transformService.getVersions(this.transformId).subscribe({
            next: (response) => {
                this.versions.set(response.data || []);
            },
        });
    }

    resetForm() {
        this.transformForm.reset({
            name: '',
            description: '',
            code: `/**
 * Kyrazo Transformer
 *
 * Available Utilities:
 * - _ (lodash): Advanced data manipulation
 * - dayjs: Comprehensive date/time management
 * - crypto: secure hashing via crypto.hmac(key, data) or crypto.sha256(data)
 * - console: Debug using console.log() in the "Test & Debug" tab
 *
 * @param {Object} payload - The incoming event
 * @param {string} payload.id - Unique event identifier (Static)
 * @param {string} payload.type - Human-readable event name (Static)
 * @param {number} payload.timestamp - Epoch timestamp (Static)
 * @param {Object} payload.data - The actual event payload (Customizable)
 */

// 1. Extract and transform your data
const originalData = payload.data;
const transformedData = {
    ...originalData,
    // Add custom fields or modify existing ones here
    processed_at: dayjs().toISOString(),
    env: 'production'
};

// 2. Return the final payload
// Note: id, type, and timestamp are typically kept as-is
return {
    ...payload,
    data: transformedData
};`,
            isActive: true,
        });
        this.currentVersion.set(null);
        this.testResult.set(null);
        this.testLogs.set([]);
    }

    onTest() {
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

        this.isTesting.set(true);
        this.transformService
            .test({
                code: this.transformForm.get('code')?.value,
                transformId: this.transformId || undefined,
                payload,
            })
            .subscribe({
                next: (response) => {
                    this.testResult.set(response.data.result);
                    this.testLogs.set(response.data.logs);
                    this.testExecutionTime.set(response.data.executionTimeMs);
                    this.isTesting.set(false);
                },
                error: (err) => {
                    this.isTesting.set(false);
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
        if (this.transformForm.invalid) return;

        this.loading.set(true);
        const data = this.transformForm.value;

        if (this.isEditing()) {
            this.transformService.update(this.transformId!, data).subscribe({
                next: () => {
                    this.mes.add({
                        severity: 'success',
                        summary: 'Updated',
                        detail: 'Transform updated successfully',
                    });
                    this.loading.set(false);
                    this.onSuccess.emit();
                },
                error: (err) => {
                    this.loading.set(false);
                    this.mes.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to update transform',
                    });
                },
            });
        } else {
            this.transformService.create(data).subscribe({
                next: () => {
                    this.mes.add({
                        severity: 'success',
                        summary: 'Created',
                        detail: 'Transform created successfully',
                    });
                    this.loading.set(false);
                    this.onSuccess.emit();
                },
                error: (err) => {
                    this.loading.set(false);
                    this.mes.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to create transform',
                    });
                },
            });
        }
    }

    rollback(version: number) {
        if (!this.transformId) return;
        this.loading.set(true);
        this.transformService.rollback(this.transformId, version).subscribe({
            next: () => {
                this.mes.add({
                    severity: 'success',
                    summary: 'Rollback Successful',
                    detail: `Reverted to version ${version}`,
                });
                this.loadTransform(); // Reload code
                this.loadVersions(); // Refresh history
                this.loading.set(false);
            },
            error: (err) => {
                this.loading.set(false);
                this.mes.add({
                    severity: 'error',
                    summary: 'Rollback Failed',
                    detail: 'Failed to revert version',
                });
            },
        });
    }

    cancel() {
        this.onCancel.emit();
    }
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { DialogService } from '@shared/services/dialog.service';
import { ASQSService } from '@core/services/asqs.service';
import { MessageService } from 'primeng/api';
import { SentryService } from '@core/3rd-party/sentry';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { DividerModule } from 'primeng/divider';
import { CodeEditorComponent } from '@shared/components/code-editor/code-editor.component';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
    selector: 'app-asqs-create-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        FloatLabelModule,
        MessageModule,
        SelectModule,
        SkeletonModule,
        ToggleSwitch,
        DividerModule,
        CodeEditorComponent,
        FormsModule,
        PasswordModule,
    ],
    templateUrl: './asqs-create-dialog.component.html',
})
export class ASQSCreateDialogComponent {
    private fb = inject(FormBuilder);
    private asqsService = inject(ASQSService);
    public dialogService = inject(DialogService);
    private mes = inject(MessageService);
    private sentry = inject(SentryService);

    visible = signal(false);
    loading = signal(false);
    testing = signal(false);
    fetching = signal(false);
    asqsId = signal<string | null>(null);

    asqsForm: FormGroup;

    constructor() {
        this.asqsForm = this.fb.group({
            name: ['', [Validators.required]],
            queueUrl: ['', [Validators.required]],
            region: ['us-east-1', [Validators.required]],
            accessKeyId: ['', [Validators.required]],
            secretAccessKey: ['', [Validators.required]],
        });
    }

    useTransformer = false;
    transformerCode = this.getDefaultTransformerCode();

    private getDefaultTransformerCode(): string {
        return `/**
 * Kyrazo Managed Transformer
 * 
 * @param {Object} payload - The incoming event
 * @return {Object} The transformed payload
 */
return function transform(payload) {
    return payload;
}(payload);`;
    }

    ngOnInit() {
        this.dialogService.asqsDialogState$.subscribe((state) => {
            if (state.visible) {
                if (state.asqsId) {
                    this.asqsId.set(state.asqsId);
                    this.loadQueue(state.asqsId);
                } else {
                    this.asqsId.set(null);
                    this.useTransformer = false;
                    this.transformerCode = this.getDefaultTransformerCode();
                    this.asqsForm.reset({ region: 'us-east-1' });
                    this.asqsForm.get('queueUrl')?.enable();
                    this.asqsForm.get('region')?.enable();
                    this.asqsForm.get('accessKeyId')?.setValidators([Validators.required]);
                    this.asqsForm.get('secretAccessKey')?.setValidators([Validators.required]);
                }
                this.asqsForm.get('accessKeyId')?.updateValueAndValidity();
                this.asqsForm.get('secretAccessKey')?.updateValueAndValidity();
            }
            this.visible.set(state.visible);
        });
    }

    loadQueue(id: string) {
        this.fetching.set(true);
        this.asqsService.get(id).subscribe({
            next: (res) => {
                this.fetching.set(false);
                if (res.data) {
                    this.asqsForm.patchValue({
                        name: res.data.name,
                        queueUrl: res.data.queueUrl,
                        region: res.data.region
                    });
                    // Credentials are optional on update
                    this.asqsForm.get('accessKeyId')?.clearValidators();
                    this.asqsForm.get('secretAccessKey')?.clearValidators();
                    this.asqsForm.get('accessKeyId')?.updateValueAndValidity();
                    this.asqsForm.get('secretAccessKey')?.updateValueAndValidity();

                    this.asqsForm.get('queueUrl')?.disable();
                    this.asqsForm.get('region')?.disable();

                    // Transformer logic
                    if (res.data.transformer) {
                        this.useTransformer = true;
                        this.transformerCode = typeof res.data.transformer === 'object' ? res.data.transformer.code : this.getDefaultTransformerCode();
                    } else {
                        this.useTransformer = false;
                        this.transformerCode = this.getDefaultTransformerCode();
                    }
                }
            },
            error: (err) => {
                this.fetching.set(false);
                this.sentry.captureException(err);
                this.mes.add({
                    severity: 'error',
                    summary: 'Load Failed',
                    detail: 'Could not load queue details',
                });
            },
        });
    }

    onTest() {
        if (this.asqsForm.invalid) {
            this.asqsForm.markAllAsTouched();
            return;
        }

        this.testing.set(true);
        this.asqsService.test(this.asqsForm.getRawValue()).subscribe({
            next: (res) => {
                this.testing.set(false);
                if (res.success) {
                    this.mes.add({
                        severity: 'success',
                        summary: 'Connection Successful',
                        detail: 'Successfully reached ASQS queue',
                    });
                } else {
                    this.mes.add({
                        severity: 'error',
                        summary: 'Connection Failed',
                        detail: res.message || 'Could not verify ASQS queue',
                    });
                }
            },
            error: (err) => {
                this.testing.set(false);
                this.sentry.captureException(err);
                this.mes.add({
                    severity: 'error',
                    summary: 'Test Failed',
                    detail: err.message,
                });
            },
        });
    }

    onSubmit() {
        if (this.asqsForm.invalid) {
            this.asqsForm.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        const id = this.asqsId();
        const payload: any = this.asqsForm.getRawValue();

        if (this.useTransformer) {
            payload.transformer = {
                code: this.transformerCode,
                name: `${payload.name} Transformer`,
            };
        } else if (id) {
            payload.transformer = null;
        }

        const obs = id 
            ? this.asqsService.update(id, payload) 
            : this.asqsService.create(payload);

        obs.subscribe({
            next: (res) => {
                this.loading.set(false);
                this.mes.add({
                    severity: 'success',
                    summary: id ? 'Queue Updated' : 'Queue Added',
                    detail: id ? 'ASQS queue destination updated successfully' : 'ASQS queue destination created successfully',
                });
                this.dialogService.notifyASQSSaved(res.data);
                this.close();
            },
            error: (err) => {
                this.loading.set(false);
                this.sentry.captureException(err);
                this.mes.add({
                    severity: 'error',
                    summary: id ? 'Update Failed' : 'Creation Failed',
                    detail: err.message,
                });
            },
        });
    }

    close() {
        this.dialogService.closeASQSDialog();
    }
}

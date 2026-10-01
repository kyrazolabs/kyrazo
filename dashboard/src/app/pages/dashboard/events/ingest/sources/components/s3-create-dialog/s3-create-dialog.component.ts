import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { DialogService } from '@shared/services/dialog.service';
import { S3Service } from '@core/services/s3.service';
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
    selector: 'app-s3-create-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        FloatLabelModule,
        MessageModule,
        PasswordModule,
        SelectModule,
        SkeletonModule,
        ToggleSwitch,
        DividerModule,
        CodeEditorComponent,
        FormsModule
    ],
    templateUrl: './s3-create-dialog.component.html',
})
export class S3CreateDialogComponent {
    private fb = inject(FormBuilder);
    private s3Service = inject(S3Service);
    public dialogService = inject(DialogService);
    private mes = inject(MessageService);
    private sentry = inject(SentryService);

    visible = signal(false);
    loading = signal(false);
    testing = signal(false);
    fetching = signal(false);
    s3Id = signal<string | null>(null);

    s3Form: FormGroup;

    constructor() {
        this.s3Form = this.fb.group({
            name: ['', [Validators.required]],
            bucketName: ['', [Validators.required]],
            region: ['us-east-1', [Validators.required]],
            accessKeyId: ['', [Validators.required]],
            secretAccessKey: ['', [Validators.required]],
            endpoint: [''],
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
        this.dialogService.s3DialogState$.subscribe((state) => {
            if (state.visible) {
                if (state.s3Id) {
                    this.s3Id.set(state.s3Id);
                    this.loadBucket(state.s3Id);
                } else {
                    this.s3Id.set(null);
                    this.useTransformer = false;
                    this.transformerCode = this.getDefaultTransformerCode();
                    this.s3Form.reset({ region: 'us-east-1' });
                    this.s3Form.get('bucketName')?.enable();
                    this.s3Form.get('region')?.enable();
                    this.s3Form.get('endpoint')?.enable();
                    this.s3Form.get('accessKeyId')?.setValidators([Validators.required]);
                    this.s3Form.get('secretAccessKey')?.setValidators([Validators.required]);
                }
                this.s3Form.get('accessKeyId')?.updateValueAndValidity();
                this.s3Form.get('secretAccessKey')?.updateValueAndValidity();
            }
            this.visible.set(state.visible);
        });
    }

    loadBucket(id: string) {
        this.fetching.set(true);
        this.s3Service.get(id).subscribe({
            next: (res) => {
                this.fetching.set(false);
                if (res.data) {
                    this.s3Form.patchValue({
                        name: res.data.name,
                        bucketName: res.data.bucketName,
                        region: res.data.region,
                        endpoint: res.data.endpoint
                    });
                    // Credentials are optional on update
                    this.s3Form.get('accessKeyId')?.clearValidators();
                    this.s3Form.get('secretAccessKey')?.clearValidators();
                    this.s3Form.get('accessKeyId')?.updateValueAndValidity();
                    this.s3Form.get('secretAccessKey')?.updateValueAndValidity();
                    
                    this.s3Form.get('bucketName')?.disable();
                    this.s3Form.get('region')?.disable();
                    this.s3Form.get('endpoint')?.disable();

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
                    detail: 'Could not load bucket details',
                });
            },
        });
    }

    onTest() {
        if (this.s3Form.invalid) {
            this.s3Form.markAllAsTouched();
            return;
        }

        this.testing.set(true);
        this.s3Service.test(this.s3Form.getRawValue()).subscribe({
            next: (res) => {
                this.testing.set(false);
                if (res.success) {
                    this.mes.add({
                        severity: 'success',
                        summary: 'Connection Successful',
                        detail: 'Successfully connected to S3 bucket',
                    });
                } else {
                    this.mes.add({
                        severity: 'error',
                        summary: 'Connection Failed',
                        detail: res.message || 'Could not connect to S3 bucket',
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
        if (this.s3Form.invalid) {
            this.s3Form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        const id = this.s3Id();
        const payload: any = this.s3Form.getRawValue();

        if (this.useTransformer) {
            payload.transformer = {
                code: this.transformerCode,
                name: `${payload.name} Transformer`,
            };
        } else if (id) {
            payload.transformer = null;
        }

        const obs = id 
            ? this.s3Service.update(id, payload) 
            : this.s3Service.create(payload);

        obs.subscribe({
            next: (res) => {
                this.loading.set(false);
                this.mes.add({
                    severity: 'success',
                    summary: id ? 'Bucket Updated' : 'Bucket Added',
                    detail: id ? 'S3 bucket destination updated successfully' : 'S3 bucket destination created successfully',
                });
                this.dialogService.notifyS3Saved(res.data);
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
        this.dialogService.closeS3Dialog();
    }
}

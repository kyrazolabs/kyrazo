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

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';

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

        this.dialogService.s3DialogState$.subscribe((state) => {
            if (state.visible) {
                this.s3Form.reset({ region: 'us-east-1' });
            }
            this.visible.set(state.visible);
        });
    }

    onTest() {
        if (this.s3Form.invalid) {
            this.s3Form.markAllAsTouched();
            return;
        }

        this.testing.set(true);
        this.s3Service.test(this.s3Form.value).subscribe({
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
        this.s3Service.create(this.s3Form.value).subscribe({
            next: (res) => {
                this.loading.set(false);
                this.mes.add({
                    severity: 'success',
                    summary: 'Bucket Added',
                    detail: 'S3 bucket destination created successfully',
                });
                this.dialogService.notifyS3Saved(res.data);
                this.close();
            },
            error: (err) => {
                this.loading.set(false);
                this.sentry.captureException(err);
                this.mes.add({
                    severity: 'error',
                    summary: 'Creation Failed',
                    detail: err.message,
                });
            },
        });
    }

    close() {
        this.dialogService.closeS3Dialog();
    }
}

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

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';

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
        PasswordModule,
        SelectModule,
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

    asqsForm: FormGroup;

    constructor() {
        this.asqsForm = this.fb.group({
            name: ['', [Validators.required]],
            queueUrl: ['', [Validators.required]],
            region: ['us-east-1', [Validators.required]],
            accessKeyId: ['', [Validators.required]],
            secretAccessKey: ['', [Validators.required]],
        });

        this.dialogService.asqsDialogState$.subscribe((state) => {
            if (state.visible) {
                this.asqsForm.reset({ region: 'us-east-1' });
            }
            this.visible.set(state.visible);
        });
    }

    onTest() {
        if (this.asqsForm.invalid) {
            this.asqsForm.markAllAsTouched();
            return;
        }

        this.testing.set(true);
        this.asqsService.test(this.asqsForm.value).subscribe({
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
        this.asqsService.create(this.asqsForm.value).subscribe({
            next: (res) => {
                this.loading.set(false);
                this.mes.add({
                    severity: 'success',
                    summary: 'Queue Added',
                    detail: 'ASQS queue destination created successfully',
                });
                this.dialogService.notifyASQSSaved(res.data);
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
        this.dialogService.closeASQSDialog();
    }
}

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputOtpModule } from 'primeng/inputotp';
import { MessageService } from 'primeng/api';
import { AuthService } from '@core/auth/auth.service';
import { DialogService } from '@shared/services/dialog.service';
import { AutoFocusModule } from 'primeng/autofocus';

@Component({
    selector: 'app-twofa-setup-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        AutoFocusModule,
        DialogModule,
        ButtonModule,
        InputOtpModule,
    ],
    templateUrl: './twofa-setup-dialog.component.html',
})
export class TwofaSetupDialogComponent implements OnInit {
    private readonly authService = inject(AuthService);
    private readonly messageService = inject(MessageService);
    public readonly dialogService = inject(DialogService);

    visible = false;
    step = 1; // 1: method, 2: scan/verify
    method: 'app' | 'email' = 'app';
    setupResponse: any = null;
    verificationCode = '';
    isVerifying = false;
    backupCodes: string[] = [];

    ngOnInit() {
        this.dialogService.twofaSetupDialogState$.subscribe((state) => {
            this.visible = state.visible;
            if (this.visible) {
                this.reset();
            }
        });
    }

    reset() {
        this.step = 1;
        this.verificationCode = '';
        this.setupResponse = null;
        this.isVerifying = false;
        this.backupCodes = [];
    }

    onHide() {
        this.dialogService.closeTwofaSetupDialog();
    }

    selectMethod(method: 'app' | 'email') {
        this.method = method;
        this.step = 2;
        this.isVerifying = true;

        this.authService.setup2FA({ method }).subscribe({
            next: (res: any) => {
                this.isVerifying = false;
                this.setupResponse = res.data;
            },
            error: (err: any) => {
                this.isVerifying = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to initiate 2FA setup',
                });
            },
        });
    }

    verify() {
        if (this.verificationCode.length < 6) return;

        this.isVerifying = true;
        this.authService
            .verify2FASetup({
                method: this.method,
                code: this.verificationCode,
            })
            .subscribe({
                next: (res: any) => {
                    this.isVerifying = false;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: '2FA enabled successfully!',
                    });

                    this.backupCodes = res.data?.backupCodes || [];
                    if (this.backupCodes.length > 0) {
                        this.step = 3;
                    } else {
                        this.dialogService.closeTwofaSetupDialog();
                    }

                    this.dialogService.notifyTwofaEnabled();
                },
                error: (err: any) => {
                    this.isVerifying = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Verification Failed',
                        detail: err.error?.error?.message || 'Invalid code',
                    });
                },
            });
    }

    copyBackupCodes() {
        const text = this.backupCodes.join('\n');
        navigator.clipboard.writeText(text).then(() => {
            this.messageService.add({
                severity: 'success',
                summary: 'Copied',
                detail: 'Backup codes copied to clipboard!',
            });
        });
    }
}

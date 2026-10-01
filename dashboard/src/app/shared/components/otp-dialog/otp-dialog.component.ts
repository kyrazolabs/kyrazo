import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputOtpModule } from 'primeng/inputotp';
import { AutoFocusModule } from 'primeng/autofocus';
import { OtpService } from '@core/services/otp.service';
import { AuthService } from '@core/auth/auth.service';

@Component({
    selector: 'app-otp-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        AutoFocusModule,
        DialogModule,
        ButtonModule,
        InputOtpModule,
    ],
    templateUrl: './otp-dialog.component.html',
    styles: [
        `
            :host ::ng-deep {
                .p-dialog-content {
                    padding-top: 1.5rem;
                }
                .p-inputotp {
                    justify-content: center;
                }
            }
        `,
    ],
})
export class OtpDialogComponent {
    otpService = inject(OtpService);
    private authService = inject(AuthService);

    code = '';
    loading = false;
    error = '';
    isBackupCode = false;

    onVisibleChange(visible: boolean) {
        if (!visible) {
            this.code = '';
            this.error = '';
            this.isBackupCode = false;
        }
    }

    verify() {
        if (this.isBackupCode ? this.code.length < 8 : this.code.length < 6)
            return;

        const state = this.otpService.state();
        if (!state.action) return;

        this.loading = true;
        this.error = '';

        this.authService
            .verifySensitiveOTP({
                action: state.action,
                code: this.code,
            })
            .subscribe({
                next: (res) => {
                    this.loading = false;
                    if (res.success) {
                        state.onSuccess();
                        this.code = '';
                    } else {
                        this.error = 'Invalid code. Please try again.';
                    }
                },
                error: (err) => {
                    this.loading = false;
                    this.error =
                        err.error?.error?.message || 'Verification failed';
                },
            });
    }

    cancel() {
        if (this.otpService.state().show) {
            this.otpService.state().onCancel();
        }
    }

    toggleBackupCode() {
        this.isBackupCode = !this.isBackupCode;
        this.code = '';
        this.error = '';
    }

    requestNewOtp() {
        const state = this.otpService.state();
        if (!state.action) return;

        this.authService
            .requestSensitiveOTP({ action: state.action })
            .subscribe({
                next: () => {
                    // Show a small toast or message
                },
                error: (err) => {
                    this.error = 'Failed to resend OTP';
                },
            });
    }
}

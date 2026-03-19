import {
    ChangeDetectionStrategy,
    Component,
    inject,
    OnInit,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ReactiveFormsModule,
    FormBuilder,
    Validators,
    FormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PasswordModule } from 'primeng/password';
import { InputOtpModule } from 'primeng/inputotp';

import { AuthService } from '@core/auth/auth.service';
import { LayoutService } from '@components/service/layout.service';
import { DividerModule } from 'primeng/divider';
import { AppConfig } from '@components/app.config';
import { environment } from 'environments/environment';
import { AutoFocusModule } from 'primeng/autofocus';

declare const google: any;

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        AutoFocusModule,
        FormsModule,
        CardModule,
        ButtonModule,
        CheckboxModule,
        InputText,
        PasswordModule,
        ProgressSpinnerModule,
        RouterLink,
        DividerModule,
        AppConfig,
        InputOtpModule,
    ],
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    public readonly layoutService = inject(LayoutService);

    private codeClient: any;

    readonly form = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        rememberMe: [false],
    });

    readonly loading = signal(false);
    readonly showPassword = signal(false);
    readonly pending2FA = signal(false);
    readonly twofaMethod = signal<'app' | 'email' | null>(null);
    readonly tempToken = signal<string | null>(null);
    readonly otpCode = signal('');
    readonly isBackupCode = signal(false);

    // Computed properties for better UX
    get isFormValid(): boolean {
        return this.form.valid && !this.loading();
    }

    togglePasswordVisibility(): void {
        this.showPassword.set(!this.showPassword());
    }

    getFieldErrorMessage(fieldName: string): string {
        const control = this.form.get(fieldName);
        if (!control?.errors || !control.touched) return '';

        const errors = control.errors;

        switch (fieldName) {
            case 'email':
                if (errors['required']) return 'Email is required';
                if (errors['email'])
                    return 'Please enter a valid email address';
                break;
            case 'password':
                if (errors['required']) return 'Password is required';
                if (errors['minlength'])
                    return 'Password must be at least 6 characters';
                break;
        }

        return '';
    }

    isFieldInvalid(fieldName: string): boolean {
        const control = this.form.get(fieldName);
        return !!(control?.invalid && control?.touched);
    }

    onSubmit(): void {
        if (!this.form.valid) {
            // Mark all fields as touched to show validation errors
            Object.keys(this.form.controls).forEach((key) => {
                this.form.get(key)?.markAsTouched();
            });

            this.messageService.add({
                severity: 'error',
                summary: 'Form Invalid',
                detail: 'Please correct the errors below',
                life: 5000,
            });
            return;
        }

        this.login();
    }

    private login(): void {
        this.loading.set(true);

        const { email, password } = this.form.getRawValue();

        this.authService.login({ email, password }).subscribe({
            next: (response) => {
                this.loading.set(false);

                if (response.pending_2fa) {
                    this.pending2FA.set(true);
                    this.twofaMethod.set(response.method || 'email');
                    this.tempToken.set(response.temp_token || null);
                    this.messageService.add({
                        severity: 'info',
                        summary: '2FA Required',
                        detail: 'Please enter your verification code',
                        life: 3000,
                    });
                    return;
                }

                this.messageService.add({
                    severity: 'success',
                    summary: 'Welcome back!',
                    detail: 'Successfully signed in',
                    life: 3000,
                });

                this.onLoginSuccess();
            },
            error: (error: any) => {
                this.loading.set(false);
                const errorMessage =
                    error?.error?.error?.message ||
                    error?.error?.message ||
                    'Login failed. Please check your credentials.';

                this.messageService.add({
                    severity: 'error',
                    summary: 'Login Failed',
                    detail: errorMessage,
                    life: 5000,
                });

                // Handle specific error cases
                if (
                    errorMessage.toLowerCase().includes('email') ||
                    errorMessage.toLowerCase().includes('not found')
                ) {
                    const emailControl = this.form.get('email');
                    emailControl?.setErrors({ emailNotFound: true });
                    emailControl?.markAsTouched();
                }

                if (
                    errorMessage.toLowerCase().includes('password') ||
                    errorMessage.toLowerCase().includes('incorrect')
                ) {
                    const passwordControl = this.form.get('password');
                    passwordControl?.setErrors({ incorrectPassword: true });
                    passwordControl?.markAsTouched();
                }
            },
        });
    }

    private onLoginSuccess(): void {
        setTimeout(() => {
            const returnUrl =
                this.route.snapshot.queryParamMap.get('returnUrl');
            if (returnUrl) {
                this.router.navigate([returnUrl], { replaceUrl: true });
            } else {
                this.router.navigate(['/'], { replaceUrl: true });
            }
        }, 1000);
    }

    verify2FA(): void {
        const code = this.otpCode();
        const tempToken = this.tempToken();

        if (
            !tempToken ||
            (this.isBackupCode() ? code.length < 8 : code.length < 6)
        )
            return;

        this.loading.set(true);
        this.authService.login2FA({ code, tempToken }).subscribe({
            next: (res) => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Welcome back!',
                    detail: 'Successfully signed in',
                    life: 3000,
                });
                this.onLoginSuccess();
            },
            error: (err) => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Verification Failed',
                    detail:
                        err.error?.error?.message ||
                        'Invalid verification code',
                    life: 5000,
                });
            },
        });
    }

    resendOTP(): void {
        const tempToken = this.tempToken();
        if (!tempToken) return;

        this.loading.set(true);
        this.authService.resend2FA(tempToken).subscribe({
            next: (res) => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Code Resent',
                    detail: 'A new verification code has been sent to your email',
                    life: 5000,
                });
                this.otpCode.set('');
            },
            error: (err) => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Resend Failed',
                    detail:
                        err.error?.error?.message ||
                        'Failed to resend verification code',
                    life: 5000,
                });
            },
        });
    }

    ngOnInit() {
        this.codeClient = google.accounts.oauth2.initCodeClient({
            client_id: environment.auth.googleClientId,
            scope: 'openid email profile',
            ux_mode: 'popup',
            callback: (response: any) => this.onGoogleCode(response),
        });

        google.accounts.id.initialize({
            client_id: environment.auth.googleClientId,
            callback: (res: any) => this.onGoogleResponse(res),
            ux_mode: 'popup',
        });
        google.accounts.id.prompt();
    }

    googleLogin() {
        this.codeClient.requestCode();
    }

    async onGoogleResponse(res: any) {
        const idToken = res.credential;
        this.loading.set(true);
        this.authService.onGoogleResponse(idToken).subscribe({
            next: (response) => {
                this.loading.set(false);
                if (response.pending_2fa) {
                    this.pending2FA.set(true);
                    this.twofaMethod.set(response.method || 'email');
                    this.tempToken.set(response.temp_token || null);
                    this.messageService.add({
                        severity: 'info',
                        summary: '2FA Required',
                        detail: 'Please enter your verification code',
                        life: 3000,
                    });
                    return;
                }
                this.authService.handleAuthSuccess(response);
                this.router.navigate(['/'], { replaceUrl: true });
            },
            error: (error: any) => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Login Failed',
                    detail:
                        error?.error?.message ||
                        'Login failed. Please try again.',
                    life: 5000,
                });
            },
        });
    }

    async onGoogleCode(res: any) {
        if (!res?.code) return;
        this.loading.set(true);
        this.authService.onGoogleCode(res.code).subscribe({
            next: (response) => {
                this.loading.set(false);
                if (response.pending_2fa) {
                    this.pending2FA.set(true);
                    this.twofaMethod.set(response.method || 'email');
                    this.tempToken.set(response.temp_token || null);
                    this.messageService.add({
                        severity: 'info',
                        summary: '2FA Required',
                        detail: 'Please enter your verification code',
                        life: 3000,
                    });
                    return;
                }
                this.authService.handleAuthSuccess(response);
                this.router.navigate(['/'], { replaceUrl: true });
            },
            error: (error: any) => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Login Failed',
                    detail:
                        error?.error?.message ||
                        'Login failed. Please try again.',
                    life: 5000,
                });
            },
        });
    }

    // Quick login with demo credentials
    loginWithDemo(): void {
        this.form.patchValue({
            email: 'demo@kyrazo.dev',
            password: 'password',
        });

        // Small delay for better UX
        setTimeout(() => {
            this.onSubmit();
        }, 300);
    }

    onForgotPassword(): void {
        // You can implement forgot password functionality here
        this.router.navigate(['/auth/forget-password']);
    }

    toggleBackupCode(): void {
        this.isBackupCode.set(!this.isBackupCode());
        this.otpCode.set('');
    }
}

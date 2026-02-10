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

import { AuthService } from '@core/auth/auth.service';
import { LayoutService } from '@components/service/layout.service';
import { DividerModule } from 'primeng/divider';
import { AppConfig } from '@components/app.config';
import { environment } from 'environments/environment';

declare const google: any;

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
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
                this.messageService.add({
                    severity: 'success',
                    summary: 'Welcome back!',
                    detail: 'Successfully signed in',
                    life: 3000,
                });

                setTimeout(() => {
                    if (this.route.snapshot.queryParamMap.get('returnUrl')) {
                        this.router.navigate(
                            [
                                this.route.snapshot.queryParamMap.get(
                                    'returnUrl',
                                ),
                            ],
                            { replaceUrl: true },
                        );
                    } else {
                        this.router.navigate(['/'], { replaceUrl: true });
                    }
                }, 1000);
            },
            error: (error) => {
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
        this.authService.onGoogleResponse(idToken).subscribe({
            next: (res) => {
                this.authService.handleAuthSuccess(res);
                this.router.navigate(['/'], { replaceUrl: true });
            },
            error: (error) => {
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
        this.authService.onGoogleCode(res.code).subscribe({
            next: (res) => {
                this.authService.handleAuthSuccess(res);
                this.router.navigate(['/'], { replaceUrl: true });
            },
            error: (error) => {
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

    // Navigate to forgot password page
    onForgotPassword(): void {
        // You can implement forgot password functionality here
        this.messageService.add({
            severity: 'info',
            summary: 'Forgot Password',
            detail: 'Forgot password functionality will be implemented soon',
            life: 3000,
        });
        this.router.navigate(['/auth/forget-password']);
    }
}

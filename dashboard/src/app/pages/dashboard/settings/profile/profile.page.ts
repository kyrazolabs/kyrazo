import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormsModule,
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { SettingService } from '@core/services/settings.service';
import { AuthService } from '@core/auth/auth.service';
import { UserProfileResponse } from '@models/auth.types';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { finalize } from 'rxjs';
import { SentryService } from '@core/3rd-party/sentry';
import { PostHogService } from '@core/3rd-party/posthog';
import { DialogService } from '@shared/services/dialog.service';

@Component({
    selector: 'app-profile-settings',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        CardModule,
        InputTextModule,
        SelectModule,
        ButtonModule,
        TagModule,
        TooltipModule,
        ToastModule,
    ],
    templateUrl: './profile.page.html',
    styleUrl: './profile.page.scss',
})
export class ProfileSettingsPage {
    private route = inject(ActivatedRoute);
    private readonly sts = inject(SettingService);
    private readonly authService = inject(AuthService);
    private readonly messageService = inject(MessageService);
    private readonly fb = inject(FormBuilder);
    private readonly sentry = inject(SentryService);
    private readonly posthog = inject(PostHogService);
    private readonly dialogService = inject(DialogService);

    // Reactive forms
    profileForm!: FormGroup;
    passwordForm!: FormGroup;
    originalProfile: UserProfileResponse | null = null;
    isSaving = false;
    isChangingPassword = false;

    timezoneOptions = [
        { label: 'UTC', value: 'UTC' },
        { label: 'Eastern Time (US & Canada)', value: 'America/New_York' },
        { label: 'Central Time (US & Canada)', value: 'America/Chicago' },
        { label: 'Mountain Time (US & Canada)', value: 'America/Denver' },
        { label: 'Pacific Time (US & Canada)', value: 'America/Los_Angeles' },
        { label: 'Alaska Time', value: 'America/Anchorage' },
        { label: 'Hawaii Time', value: 'Pacific/Honolulu' },

        { label: 'London (UK)', value: 'Europe/London' },
        { label: 'Paris (France)', value: 'Europe/Paris' },
        { label: 'Berlin (Germany)', value: 'Europe/Berlin' },
        { label: 'Madrid (Spain)', value: 'Europe/Madrid' },
        { label: 'Rome (Italy)', value: 'Europe/Rome' },
        { label: 'Amsterdam (Netherlands)', value: 'Europe/Amsterdam' },
        { label: 'Athens (Greece)', value: 'Europe/Athens' },
        { label: 'Moscow (Russia)', value: 'Europe/Moscow' },

        { label: 'Cairo (Egypt)', value: 'Africa/Cairo' },
        { label: 'Johannesburg (South Africa)', value: 'Africa/Johannesburg' },
        { label: 'Nairobi (Kenya)', value: 'Africa/Nairobi' },

        { label: 'Dubai (UAE)', value: 'Asia/Dubai' },
        { label: 'Riyadh (Saudi Arabia)', value: 'Asia/Riyadh' },
        { label: 'Tel Aviv (Israel)', value: 'Asia/Jerusalem' },
        { label: 'Istanbul (Turkey)', value: 'Europe/Istanbul' },
        { label: 'Tehran (Iran)', value: 'Asia/Tehran' },

        { label: 'Karachi (Pakistan)', value: 'Asia/Karachi' },
        { label: 'Delhi (India)', value: 'Asia/Kolkata' },
        { label: 'Dhaka (Bangladesh)', value: 'Asia/Dhaka' },
        { label: 'Jakarta (Indonesia)', value: 'Asia/Jakarta' },
        { label: 'Bangkok (Thailand)', value: 'Asia/Bangkok' },
        { label: 'Singapore', value: 'Asia/Singapore' },
        { label: 'Hong Kong', value: 'Asia/Hong_Kong' },
        { label: 'Shanghai (China)', value: 'Asia/Shanghai' },
        { label: 'Seoul (South Korea)', value: 'Asia/Seoul' },
        { label: 'Tokyo (Japan)', value: 'Asia/Tokyo' },

        { label: 'Sydney (Australia)', value: 'Australia/Sydney' },
        { label: 'Melbourne (Australia)', value: 'Australia/Melbourne' },
        { label: 'Perth (Australia)', value: 'Australia/Perth' },
        { label: 'Auckland (New Zealand)', value: 'Pacific/Auckland' },

        { label: 'Mexico City (Mexico)', value: 'America/Mexico_City' },
        {
            label: 'Buenos Aires (Argentina)',
            value: 'America/Argentina/Buenos_Aires',
        },
        { label: 'São Paulo (Brazil)', value: 'America/Sao_Paulo' },
        { label: 'Santiago (Chile)', value: 'America/Santiago' },
    ];

    languageOptions = [
        { label: 'English', value: 'en' },
        { label: 'Spanish', value: 'es' },
        { label: 'French', value: 'fr' },
        { label: 'German', value: 'de' },
        { label: 'Italian', value: 'it' },
        { label: 'Portuguese', value: 'pt' },
        { label: 'Japanese', value: 'ja' },
        { label: 'Korean', value: 'ko' },
    ];

    ngOnInit() {
        this.initializeForm();
        this.originalProfile = this.route.snapshot.data['profile'];
        if (this.originalProfile) {
            this.profileForm.patchValue({
                firstName: this.originalProfile.firstName,
                lastName: this.originalProfile.lastName,
                email: this.originalProfile.email,
                jobTitle: this.originalProfile.jobTitle,
                timeZone: this.originalProfile.timeZone,
                language: this.originalProfile.language,
            });
        }
    }

    private initializeForm() {
        this.profileForm = this.fb.group({
            firstName: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]],
            email: [
                { value: '', disabled: true },
                [Validators.required, Validators.email],
            ],
            jobTitle: [''],
            timeZone: [''],
            language: [''],
        });

        this.passwordForm = this.fb.group(
            {
                currentPassword: ['', [Validators.required]],
                newPassword: [
                    '',
                    [Validators.required, Validators.minLength(8)],
                ],
                confirmPassword: ['', [Validators.required]],
            },
            { validators: this.passwordMatchValidator },
        );
    }

    private passwordMatchValidator(g: FormGroup) {
        return g.get('newPassword')?.value === g.get('confirmPassword')?.value
            ? null
            : { mismatch: true };
    }

    saveProfile() {
        if (!this.profileForm.valid || this.isSaving) {
            return;
        }

        this.isSaving = true;
        const formData = this.profileForm.value;

        this.sts
            .update({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                jobTitle: formData.jobTitle,
                timeZone: formData.timeZone,
                language: formData.language,
            })
            .pipe(finalize(() => (this.isSaving = false)))
            .subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.originalProfile = response.data;
                        this.messageService.add({
                            summary: 'Success',
                            detail: 'Profile settings saved successfully!',
                        });
                        this.posthog.capture('profile_updated', {
                            timezone: formData.timeZone,
                            language: formData.language,
                        });
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to save profile',
                        });
                    }
                },
                error: (error) => {
                    this.sentry.captureException(error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to save profile settings',
                    });
                    this.posthog.capture('profile_update_error', {
                        error: error.message,
                    });
                    console.error('Error saving profile:', error);
                },
            });
    }

    changePassword() {
        if (!this.passwordForm.valid || this.isChangingPassword) {
            return;
        }

        this.isChangingPassword = true;
        const { currentPassword, newPassword } = this.passwordForm.value;

        this.authService
            .changePassword({ currentPassword, newPassword })
            .pipe(finalize(() => (this.isChangingPassword = false)))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Password changed successfully!',
                        });
                        this.posthog.capture('password_changed');
                        this.passwordForm.reset();
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail:
                                response.message || 'Failed to change password',
                        });
                    }
                },
                error: (error) => {
                    this.sentry.captureException(error);
                    this.messageService.add({
                        severity: 'error',
                        detail: 'An error occurred while changing password',
                    });
                    this.posthog.capture('password_change_error', {
                        error: error.message,
                    });
                },
            });
    }

    resetProfile() {
        if (this.originalProfile) {
            this.profileForm.patchValue({
                firstName: this.originalProfile.firstName,
                lastName: this.originalProfile.lastName,
                email: this.originalProfile.email,
                jobTitle: this.originalProfile.jobTitle,
                timeZone: this.originalProfile.timeZone,
                language: this.originalProfile.language,
            });
        }
        this.messageService.add({
            severity: 'info',
            summary: 'Reset',
            detail: 'Profile settings have been reset to original values.',
        });
    }

    toggleEmailNotifications() {
        // For now, just show a message since preferences aren't in the interface
        this.messageService.add({
            severity: 'info',
            summary: 'Info',
            detail: 'Email notifications feature coming soon!',
        });
    }

    toggleMarketingEmails() {
        // For now, just show a message since preferences aren't in the interface
        this.messageService.add({
            severity: 'info',
            summary: 'Info',
            detail: 'Marketing emails feature coming soon!',
        });
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
        switch (status.toLowerCase()) {
            case 'active':
                return 'success';
            case 'inactive':
                return 'danger';
            case 'pending':
                return 'warn';
            default:
                return 'info';
        }
    }

    formatDate(date: Date | string) {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    formatNumber(num: number): string {
        return num.toLocaleString();
    }

    copyToClipboard(text: string) {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Copied',
                    detail: 'Text copied to clipboard!',
                });
            })
            .catch(() => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to copy to clipboard',
                });
            });
    }

    openBilling() {
        this.dialogService.openBillingDialog();
    }
}

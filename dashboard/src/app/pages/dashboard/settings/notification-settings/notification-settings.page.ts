import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormBuilder, FormGroup } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";

// PrimeNG Imports
import { CardModule } from "primeng/card";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { DividerModule } from "primeng/divider";
import { MessageService } from "primeng/api";
import { ToastModule } from "primeng/toast";
import { SelectModule } from "primeng/select";

// Services and Types
import { SettingService } from "@core/services/settings.service";
import { IUserPreference } from "@models/auth.types";
import { SentryService } from "@core/3rd-party/sentry";
import { PostHogService } from "@core/3rd-party/posthog";

@Component({
  selector: "app-notification-settings",
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    ToggleSwitchModule,
    ButtonModule,
    TagModule,
    DividerModule,
    ToastModule,
    SelectModule,
  ],
  templateUrl: "./notification-settings.page.html",
  styleUrl: "./notification-settings.page.scss",
})
export class NotificationSettingsPage implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private settingsService = inject(SettingService);
  private messageService = inject(MessageService);
  private sentry = inject(SentryService);
  private posthog = inject(PostHogService);

  notificationForm!: FormGroup;
  preferences!: IUserPreference;
  isLoading = false;

  frequencyOptions = [
    { label: "Immediate", value: "immediate" },
    { label: "Every 15 minutes", value: "15min" },
    { label: "Every hour", value: "hourly" },
    { label: "Daily digest", value: "daily" },
    { label: "Weekly digest", value: "weekly" },
  ];

  quietHoursOptions = [
    { label: "No quiet hours", value: "none" },
    { label: "10 PM - 8 AM", value: "22-08" },
    { label: "11 PM - 7 AM", value: "23-07" },
    { label: "12 AM - 6 AM", value: "00-06" },
    { label: "Custom", value: "custom" },
  ];

  notificationStats = {
    totalSent: 1247,
    openRate: 87.3,
    criticalAlerts: 23,
    avgResponseTime: 4.2,
  };

  ngOnInit() {
    this.preferences = this.route.snapshot.data["notiPreferences"];
    this.createForm();
  }

  private createForm() {
    this.notificationForm = this.fb.group({
      webhookFailures: [this.preferences.notification.webhookFailures],
      dailySummary: [this.preferences.notification.dailySummary],
      securityAlerts: [this.preferences.notification.securityAlerts],
      weeklyReports: [this.preferences.notification.weeklyReports],
      emailFrequency: [
        this.preferences.notification.preferences.emailFrequency,
      ],
      quietHours: [this.preferences.notification.preferences.quietHours],
    });
  }

  saveNotifications() {
    if (this.notificationForm.valid) {
      this.isLoading = true;
      const formValue = this.notificationForm.value;

      const payload = {
        notification: {
          webhookFailures: formValue.webhookFailures,
          dailySummary: formValue.dailySummary,
          securityAlerts: formValue.securityAlerts,
          weeklyReports: formValue.weeklyReports,
          preferences: {
            emailFrequency: formValue.emailFrequency,
            quietHours: formValue.quietHours,
          },
        },
      };

      this.settingsService.updatePreferences(payload).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.messageService.add({
            severity: "success",
            summary: "Success",
            detail: "Notification settings saved successfully!",
          });
          this.posthog.capture("notification_preferences_updated", {
            email_frequency: formValue.emailFrequency,
            quiet_hours: formValue.quietHours,
          });
          // Update local preferences
          this.preferences = response.data;
        },

        error: (error) => {
          this.sentry.captureException(error);
          this.isLoading = false;
          this.messageService.add({
            severity: "error",
            detail: "Failed to save notification settings.",
          });
          this.posthog.capture("notification_preferences_update_error", {
            error: error.message,
          });
        },
      });
    }
  }

  resetToDefaults() {
    // Reset to default values
    this.notificationForm.patchValue({
      webhookFailures: true,
      dailySummary: false,
      securityAlerts: true,
      weeklyReports: false,
      emailFrequency: "immediate",
      quietHours: "none",
    });

    this.messageService.add({
      severity: "info",
      summary: "Reset",
      detail: "Notification settings have been reset to defaults.",
    });
  }
}

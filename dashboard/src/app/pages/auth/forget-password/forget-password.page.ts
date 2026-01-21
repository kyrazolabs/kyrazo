import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormsModule,
} from "@angular/forms";
import { Router, RouterLink } from "@angular/router";

import { MessageService } from "primeng/api";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { InputText } from "primeng/inputtext";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { PasswordModule } from "primeng/password";

import { AuthService } from "@core/auth/auth.service";
import { LayoutService } from "@components/service/layout.service";
import { DividerModule } from "primeng/divider";

@Component({
  selector: "app-forget-password.page",
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
    DividerModule,
  ],
  templateUrl: "./forget-password.page.html",
  styleUrl: "./forget-password.page.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgetPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  public readonly layoutService = inject(LayoutService);

  readonly form = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
  });

  readonly loading = signal(false);

  // Computed properties for better UX
  get isFormValid(): boolean {
    return this.form.valid && !this.loading();
  }

  getFieldErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.errors || !control.touched) return "";

    const errors = control.errors;

    switch (fieldName) {
      case "email":
        if (errors["required"]) return "Email is required";
        if (errors["email"]) return "Please enter a valid email address";
        break;
    }

    return "";
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
        severity: "error",
        summary: "Form Invalid",
        detail: "Please correct the errors below",
        life: 5000,
      });
      return;
    }

    this.forgetPassword();
  }

  private forgetPassword(): void {
    this.loading.set(true);

    const { email } = this.form.getRawValue();

    this.authService.forgetPassword({ email }).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.messageService.add({
          severity: "success",
          summary: "Success!",
          detail:
            "If an account with this email exists, a password reset link has been sent.",
          life: 3000,
        });
      },
      error: (error) => {
        this.loading.set(false);
        console.log(error);

        const errorCode =
          error?.error?.error?.code || error?.error?.code || "UNKNOWN_ERROR";
        const errorMessage =
          error?.error?.error?.message ||
          error?.error?.message ||
          "Login failed. Please check your credentials.";

        this.messageService.add({
          severity: "error",
          summary: errorCode,
          detail: errorMessage,
          life: 5000,
        });

        // Handle specific error cases
        if (
          errorMessage.toLowerCase().includes("email") ||
          errorMessage.toLowerCase().includes("not found")
        ) {
          const emailControl = this.form.get("email");
          emailControl?.setErrors({ emailNotFound: true });
          emailControl?.markAsTouched();
        }

        if (
          errorMessage.toLowerCase().includes("password") ||
          errorMessage.toLowerCase().includes("incorrect")
        ) {
          const passwordControl = this.form.get("password");
          passwordControl?.setErrors({ incorrectPassword: true });
          passwordControl?.markAsTouched();
        }
      },
    });
  }

  // Quick login with demo credentials
  loginWithDemo(): void {
    this.form.patchValue({
      email: "demo@kyrazo.dev",
    });

    // Small delay for better UX
    setTimeout(() => {
      this.onSubmit();
    }, 300);
  }
}

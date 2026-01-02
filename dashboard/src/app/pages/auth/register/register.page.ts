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

import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { InputText } from "primeng/inputtext";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { PasswordModule } from "primeng/password";
import { MessageService } from "primeng/api";
import { SelectModule } from "primeng/select";

import { AuthService } from "@core/auth/auth.service";
import { LayoutService } from "@components/service/layout.service";
import { AppConfig } from "@components/app.config";

@Component({
  selector: "app-register",
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    ButtonModule,
    CheckboxModule,
    InputText,
    PasswordModule,
    SelectModule,
    ProgressSpinnerModule,
    RouterLink,
    AppConfig,
  ],
  templateUrl: "./register.page.html",
  styleUrls: ["./register.page.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  public readonly layoutService = inject(LayoutService);

  readonly form = this.fb.nonNullable.group(
    {
      firstName: [
        "",
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      lastName: [
        "",
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      jobTitle: [""],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(8)]],

      confirmPassword: ["", [Validators.required]],
      agreeToTerms: [false, [Validators.requiredTrue]],
    },
    {
      validators: this.passwordMatchValidator,
    }
  );

  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly jobTitles = [
    { label: "Software Engineer", value: "Software Engineer" },
    { label: "DevOps Engineer", value: "DevOps Engineer" },
    { label: "Product Manager", value: "Product Manager" },
    { label: "Founder / CEO", value: "Founder / CEO" },
    { label: "CTO", value: "CTO" },
    { label: "Architect", value: "Architect" },
    { label: "Engineering Manager", value: "Engineering Manager" },
    { label: "Designer", value: "Designer" },
    { label: "Other", value: "Other" },
  ];

  // Computed properties for better UX
  get isFormValid(): boolean {
    return this.form.valid && !this.loading();
  }

  get passwordStrength(): string {
    const password = this.form.get("password")?.value || "";
    if (password.length === 0) return "";
    if (password.length < 6) return "weak";
    if (
      password.length < 10 &&
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
    )
      return "medium";
    if (
      password.length >= 10 &&
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)
    )
      return "strong";
    return "medium";
  }

  // Custom validator for password confirmation
  private passwordMatchValidator(form: any) {
    const password = form.get("password");
    const confirmPassword = form.get("confirmPassword");

    if (!password || !confirmPassword) return null;

    return password.value === confirmPassword.value
      ? null
      : { passwordMismatch: true };
  }

  getFieldErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.errors || !control.touched) return "";

    const errors = control.errors;

    switch (fieldName) {
      case "firstName":
      case "lastName":
        if (errors["required"])
          return `${
            fieldName === "firstName" ? "First" : "Last"
          } name is required`;
        if (errors["minlength"])
          return `${
            fieldName === "firstName" ? "First" : "Last"
          } name must be at least 2 characters`;
        if (errors["maxlength"])
          return `${
            fieldName === "firstName" ? "First" : "Last"
          } name must not exceed 50 characters`;
        break;
      case "email":
        if (errors["required"]) return "Email is required";
        if (errors["email"]) return "Please enter a valid email address";
        break;
      case "password":
        if (errors["required"]) return "Password is required";
        if (errors["minlength"])
          return "Password must be at least 8 characters";
        break;
      case "confirmPassword":
        if (errors["required"]) return "Password confirmation is required";
        break;
      case "jobTitle":
        if (errors["required"]) return "Job title is required";
        break;
      case "agreeToTerms":
        if (errors["required"])
          return "You must agree to the terms and conditions";
        break;
    }

    // Check form-level errors
    if (
      fieldName === "confirmPassword" &&
      this.form.errors?.["passwordMismatch"]
    ) {
      return "Passwords do not match";
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

    this.register();
  }

  private register(): void {
    this.loading.set(true);

    const { firstName, lastName, email, password, jobTitle } =
      this.form.getRawValue();

    this.authService
      .register({
        firstName,
        lastName,
        email,
        username: email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, ""),
        password,
        jobTitle,
      })
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.messageService.add({
            severity: "success",
            summary: "Registration Successful!",
            detail: "Welcome! Your account has been created successfully.",
            life: 4000,
          });

          // Navigate to dashboard or onboarding
          setTimeout(() => {
            this.router.navigate(["/launchpad"], { replaceUrl: true });
          }, 1500);
        },
        error: (error) => {
          this.loading.set(false);
          const errorMessage =
            error?.error?.error?.message ||
            error?.error?.message ||
            "Registration failed. Please try again.";

          this.messageService.add({
            severity: "error",
            summary: "Registration Failed",
            detail: errorMessage,
            life: 5000,
          });

          // If email already exists, focus on email field
          if (errorMessage.toLowerCase().includes("email")) {
            const emailControl = this.form.get("email");
            emailControl?.setErrors({ emailTaken: true });
            emailControl?.markAsTouched();
          }
        },
      });
  }
}

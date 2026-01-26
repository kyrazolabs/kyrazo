import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormsModule,
  AbstractControl,
  ValidationErrors,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";

import { MessageService } from "primeng/api";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { PasswordModule } from "primeng/password";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { DividerModule } from "primeng/divider";

import { AuthService } from "@core/auth/auth.service";
import { LayoutService } from "@components/service/layout.service";
import { finalize } from "rxjs";

@Component({
  selector: "app-reset-password",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    CardModule,
    ButtonModule,
    PasswordModule,
    ProgressSpinnerModule,
    DividerModule,
  ],
  templateUrl: "./reset-password.page.html",
  styleUrl: "./reset-password.page.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  public readonly layoutService = inject(LayoutService);

  readonly token = signal<string | null>(null);
  readonly loading = signal(false);
  readonly success = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      password: [
        "",
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/,
          ),
        ],
      ],
      confirmPassword: ["", [Validators.required]],
    },
    { validators: this.passwordMatchValidator },
  );

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get("token");
    if (!token) {
      this.messageService.add({
        severity: "error",
        summary: "Invalid Link",
        detail: "The password reset link is invalid or has expired.",
        sticky: true,
      });
      return;
    }
    this.token.set(token);
  }

  private passwordMatchValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const password = control.get("password");
    const confirmPassword = control.get("confirmPassword");

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  get isFormValid(): boolean {
    return this.form.valid && !this.loading() && !!this.token();
  }

  getFieldErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.errors || !control.touched) return "";

    const errors = control.errors;

    if (fieldName === "password") {
      if (errors["required"]) return "Password is required";
      if (errors["minlength"]) return "Password must be at least 8 characters";
      if (errors["pattern"])
        return "Password must contain uppercase, lowercase, number and symbol";
    }

    if (fieldName === "confirmPassword") {
      if (errors["required"]) return "Please confirm your password";
      if (errors["passwordMismatch"]) return "Passwords do not match";
    }

    return "";
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control?.invalid && control?.touched);
  }

  onSubmit(): void {
    if (!this.form.valid || !this.token()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { password } = this.form.getRawValue();

    this.authService
      .resetPassword({
        token: this.token()!,
        password,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.success.set(true);
          this.messageService.add({
            severity: "success",
            summary: "Password Reset",
            detail: "Your password has been successfully reset.",
            life: 3000,
          });
          setTimeout(() => this.router.navigate(["/auth/login"]), 3000);
        },
        error: (err) => {
          const errorMessage =
            err?.error?.error?.message ||
            err?.error?.message ||
            "Failed to reset password. The link may be expired.";
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: errorMessage,
            life: 5000,
          });
        },
      });
  }
}

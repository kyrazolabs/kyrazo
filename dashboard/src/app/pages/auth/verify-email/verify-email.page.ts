import { Component, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { finalize } from "rxjs";

@Component({
  selector: "app-verify-email",
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, ButtonModule],
  templateUrl: "./verify-email.page.html",
  styleUrl: "./verify-email.page.scss",
})
export class VerifyEmailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  loading = signal(true);
  success = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get("token");

    if (!token) {
      this.loading.set(false);
      this.error.set("Invalid or missing verification token.");
      return;
    }

    this.verifyEmail(token);
  }

  verifyEmail(token: string): void {
    this.authService
      .verifyEmail({ token })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.success.set(true);
          } else {
            this.error.set(
              response.message ||
                "Verification failed. The token might be expired."
            );
          }
        },
        error: (err) => {
          this.error.set(
            "An error occurred during verification. Please try again later."
          );
          console.error("Verification error:", err);
        },
      });
  }
}

import { Component, inject } from "@angular/core";

import { CommonModule } from "@angular/common";

import { PostHogService } from "@core/3rd-party/posthog";
import { CtaComponent } from "@pages/landing/components/cta/cta.component";

@Component({
  selector: "app-privacy-page",
  standalone: true,
  imports: [CommonModule, CtaComponent],
  templateUrl: "./privacy.page.html",
  styleUrl: "./privacy.page.scss",
})
export class PrivacyPage {
  private posthog = inject(PostHogService);

  ngOnInit() {
    this.posthog.capture("privacy_policy_viewed");
  }
}

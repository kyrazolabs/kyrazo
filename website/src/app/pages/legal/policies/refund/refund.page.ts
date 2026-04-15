import { Component, inject } from "@angular/core";

import { CommonModule } from "@angular/common";

import { PostHogService } from "@core/3rd-party/posthog";
import { CtaComponent } from "@pages/landing/components/cta/cta.component";

@Component({
  selector: "app-refund-page",
  standalone: true,
  imports: [CommonModule, CtaComponent],
  templateUrl: "./refund.page.html",
  styleUrl: "./refund.page.scss",
})
export class RefundPage {
  private posthog = inject(PostHogService);

  ngOnInit() {
    this.posthog.capture("refund_policy_viewed");
  }
}

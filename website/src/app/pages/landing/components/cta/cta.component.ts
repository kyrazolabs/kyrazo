import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";

import { RouterLink } from "@angular/router";
import { ScrollRevealDirective } from "@shared/directives/scroll-reveal.directive";
import { PostHogService } from "@core/3rd-party/posthog";

@Component({
  selector: "app-landing-cta",
  standalone: true,
  imports: [CommonModule, ButtonModule, ScrollRevealDirective, RouterLink],
  templateUrl: "./cta.component.html",
  styleUrl: "./cta.component.scss",
})
export class CtaComponent {
  private posthog = inject(PostHogService);

  trackCta() {
    this.posthog.capture("cta_early_access_clicked");
  }
}

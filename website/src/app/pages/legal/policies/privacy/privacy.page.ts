import { Component, inject } from "@angular/core";

import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";

import { UmamiService } from "@core/3rd-party/umami";
import { CtaComponent } from "@pages/landing/components/cta/cta.component";

@Component({
  selector: "app-privacy-page",
  standalone: true,
  imports: [CommonModule, RouterLink, CtaComponent],
  templateUrl: "./privacy.page.html",
  styleUrl: "./privacy.page.scss",
})
export class PrivacyPage {
  private umami = inject(UmamiService);

  ngOnInit() {
    this.umami.capture("privacy_policy_viewed");
  }
}

import { Component, inject } from "@angular/core";

import { CommonModule } from "@angular/common";

import { UmamiService } from "@core/3rd-party/umami";
import { CtaComponent } from "@pages/landing/components/cta/cta.component";

@Component({
  selector: "app-refund-page",
  standalone: true,
  imports: [CommonModule, CtaComponent],
  templateUrl: "./refund.page.html",
  styleUrl: "./refund.page.scss",
})
export class RefundPage {
  private umami = inject(UmamiService);

  ngOnInit() {
    this.umami.capture("refund_policy_viewed");
  }
}

import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HeroComponent } from "../components/hero/hero.component";
import { FeaturesComponent } from "../components/features/features.component";
import { DevExpComponent } from "../components/dev-exp/dev-exp.component";
import { CtaComponent } from "../components/cta/cta.component";
import { ServerMapComponent } from "../components/features/diagrams/server-map.component";
import { FaqComponent } from "../components/faq/faq.component";
import { TrustComponent } from "../components/trust/trust.component";
import { Motivation } from "../components/motivation/motivation";

import { PostHogService } from "@core/3rd-party/posthog";

@Component({
  selector: "app-landing",
  standalone: true,
  imports: [
    CommonModule,
    HeroComponent,
    FeaturesComponent,
    DevExpComponent,
    CtaComponent,
    ServerMapComponent,
    FaqComponent,
    TrustComponent,
    Motivation,
  ],
  templateUrl: "./landing.page.html",
  styleUrl: "./landing.page.scss",
})
export class LandingPage {
  private posthog = inject(PostHogService);

  ngOnInit() {
    this.posthog.trackPageView();
  }
}

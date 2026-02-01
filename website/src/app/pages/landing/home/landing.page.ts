import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '@pages/landing/components/hero/hero.component';
import { FeaturesComponent } from '@pages/landing/components/features/features.component';
import { DevExpComponent } from '@pages/landing/components/dev-exp/dev-exp.component';
import { CtaComponent } from '@pages/landing/components/cta/cta.component';
import { ServerMapComponent } from '@pages/landing/components/features/diagrams/server-map.component';
import { FaqComponent } from '@pages/landing/components/faq/faq.component';
import { TrustComponent } from '@pages/landing/components/trust/trust.component';
import { Motivation } from '@pages/landing/components/motivation/motivation';

import { PostHogService } from '@core/3rd-party/posthog';

@Component({
    selector: 'app-landing',
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
    templateUrl: './landing.page.html',
    styleUrl: './landing.page.scss',
})
export class LandingPage {
    private posthog = inject(PostHogService);

    ngOnInit() {
        this.posthog.trackPageView();
    }
}

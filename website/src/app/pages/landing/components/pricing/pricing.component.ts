import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';
import {
    CalendlyService,
    CALENDLY_DISCOVERY_URL,
} from '@shared/services/calendly.service';
import { UmamiService } from '@core/3rd-party/umami';

interface EnterpriseTier {
    name: string;
    slug: 'professional' | 'enterprise';
    priceLabel: string;
    periodLabel?: string;
    priceNote?: string;
    commitment: string;
    description: string;
    highlighted?: boolean;
    tag?: string;
    ctaLabel: string;
    ctaAction: 'calendly' | 'mailto';
    features: string[];
}

@Component({
    selector: 'app-landing-pricing',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, ScrollRevealDirective],
    templateUrl: './pricing.component.html',
    styleUrl: './pricing.component.scss',
})
export class PricingComponent {
    private umami = inject(UmamiService);
    private calendly = inject(CalendlyService);

    readonly calendlyUrl = CALENDLY_DISCOVERY_URL;

    readonly plans: EnterpriseTier[] = [
        {
            name: 'Professional',
            slug: 'professional',
            priceLabel: '$499',
            periodLabel: '/month',
            commitment: 'Annual contract required',
            description:
                'A fully dedicated Kyrazo environment — your own compute, database, and delivery workers. Nothing shared, ever.',
            highlighted: true,
            tag: 'Most Popular',
            ctaLabel: 'Book Discovery Call',
            ctaAction: 'calendly',
            features: [
                'Fully dedicated, isolated compute & database infrastructure',
                'Isolated delivery workers',
                'Dedicated environment after paid onboarding',
            ],
        },
        {
            name: 'Enterprise',
            slug: 'enterprise',
            priceLabel: 'Custom',
            priceNote: '$1,000–$5,000+ / month',
            commitment: 'Custom billing',
            description:
                'Run Kyrazo in your own cloud or a private deployment, with SLAs, support, and compliance tailored to your organization.',
            ctaLabel: 'Contact Enterprise Sales',
            ctaAction: 'mailto',
            features: [
                'Bring Your Own Cloud (BYOC) / Private Cloud deployment',
                'Custom SLAs & 24/7 priority support',
                'Custom compliance setup',
            ],
        },
    ];

    onSelect(plan: EnterpriseTier): void {
        this.umami.capture(`pricing_${plan.slug}_cta_clicked`);
        if (plan.ctaAction === 'calendly') {
            this.calendly.openDiscoveryPopup();
        } else {
            window.location.href =
                'mailto:sales@kyrazo.com?subject=Enterprise%20Plan%20Inquiry';
        }
    }
}

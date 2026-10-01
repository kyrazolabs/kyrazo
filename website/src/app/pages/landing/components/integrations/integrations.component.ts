import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';

@Component({
    selector: 'app-landing-integrations',
    standalone: true,
    imports: [CommonModule, ScrollRevealDirective],
    templateUrl: './integrations.component.html',
})
export class IntegrationsComponent {
    sources = [
        { name: 'Stripe', icon: 'icon-[logos--stripe]' },
        { name: 'GitHub', icon: 'icon-[logos--github-icon]' },
        { name: 'Shopify', icon: 'icon-[logos--shopify]' },
        { name: 'Twilio', icon: 'icon-[logos--twilio]' },
    ];

    targets = [
        { name: 'Slack', icon: 'icon-[logos--slack-icon]' },
        { name: 'Discord', icon: 'icon-[logos--discord-icon]' },
        { name: 'PagerDuty', icon: 'icon-[logos--pagerduty-icon]' },
        { name: 'PostHog', icon: 'icon-[logos--posthog-icon]' },
    ];
}

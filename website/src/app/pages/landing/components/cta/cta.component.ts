import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';

import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';
import { PostHogService } from '@core/3rd-party/posthog';

@Component({
    selector: 'app-landing-cta',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        InputTextModule,
        FormsModule,
        ScrollRevealDirective,
    ],
    templateUrl: './cta.component.html',
    styleUrl: './cta.component.scss',
})
export class CtaComponent {
    private posthog = inject(PostHogService);
    email: string = '';

    onSubmit() {
        this.posthog.capture('cta_signup', { email: this.email });
        const url = this.email
            ? `https://dash.kyrazo.com/auth/register?email=${encodeURIComponent(this.email)}`
            : 'https://dash.kyrazo.com/auth/register';
        window.open(url, '_top', 'noopener,noreferrer');
    }

    trackCta() {
        this.posthog.capture('cta_early_access_clicked');
        window.open(
            'https://dash.kyrazo.com/auth/register',
            '_top',
            'noopener,noreferrer',
        );
    }
}

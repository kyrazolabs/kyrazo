import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';
import { UmamiService } from '@core/3rd-party/umami';
import { CalendlyService } from '@shared/services/calendly.service';

@Component({
    selector: 'app-landing-cta',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        ScrollRevealDirective,
        RouterModule,
    ],
    templateUrl: './cta.component.html',
    styleUrl: './cta.component.scss',
})
export class CtaComponent {
    private umami = inject(UmamiService);
    private calendly = inject(CalendlyService);

    bookMeeting() {
        this.umami.capture('cta_book_discovery_clicked');
        this.calendly.openDiscoveryPopup();
    }

    contactSales() {
        this.umami.capture('cta_contact_sales_clicked');
        this.calendly.openDiscoveryPopup();
    }
}

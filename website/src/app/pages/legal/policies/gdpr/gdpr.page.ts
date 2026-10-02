import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UmamiService } from '@core/3rd-party/umami';
import { CtaComponent } from "@pages/landing/components/cta/cta.component";

@Component({
    selector: 'app-gdpr-page',
    standalone: true,
    imports: [CommonModule, CtaComponent],
    templateUrl: './gdpr.page.html',
    styleUrl: './gdpr.page.scss',
})
export class GDPRPage implements OnInit {
    private umami = inject(UmamiService);

    ngOnInit() {
        this.umami.capture('gdpr_compliance_viewed');
    }
}

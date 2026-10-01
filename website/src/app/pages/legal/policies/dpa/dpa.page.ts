import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UmamiService } from '@core/3rd-party/umami';
import { CtaComponent } from "@pages/landing/components/cta/cta.component";

@Component({
    selector: 'app-dpa-page',
    standalone: true,
    imports: [CommonModule, RouterLink, CtaComponent],
    templateUrl: './dpa.page.html',
    styleUrl: './dpa.page.scss',
})
export class DPAPage implements OnInit {
    private umami = inject(UmamiService);

    ngOnInit() {
        this.umami.capture('dpa_viewed');
    }
}

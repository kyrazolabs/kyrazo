import {
    AfterViewInit,
    Component,
    NgZone,
    PLATFORM_ID,
    inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';
import {
    CALENDLY_DISCOVERY_URL,
    CalendlyService,
} from '@shared/services/calendly.service';

@Component({
    selector: 'app-book-demo',
    standalone: true,
    imports: [ScrollRevealDirective],
    templateUrl: './book-demo.component.html',
})
export class BookDemoComponent implements AfterViewInit {
    private platformId = inject(PLATFORM_ID);
    private isBrowser = isPlatformBrowser(this.platformId);
    private calendly = inject(CalendlyService);
    private ngZone = inject(NgZone);

    readonly calendlyUrl = CALENDLY_DISCOVERY_URL;

    ngAfterViewInit(): void {
        if (!this.isBrowser) return;
        // The Calendly script only scans the DOM on load; SPA navigation
        // requires an explicit scan for the inline widget.
        this.ngZone.runOutsideAngular(() => {
            this.calendly.initInlineWidgets();
        });
    }
}

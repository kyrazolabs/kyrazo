import { Directive, Input, ElementRef, OnDestroy, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HeaderService, HeaderTheme } from '../services/header.service';
 
@Directive({
    selector: '[appHeaderTheme]',
    standalone: true
})
export class HeaderThemeDirective implements OnInit, OnDestroy {
    @Input('appHeaderTheme') theme: HeaderTheme = 'dark';
 
    private el = inject(ElementRef);
    private headerService = inject(HeaderService);
    private platformId = inject(PLATFORM_ID);
    private observer?: IntersectionObserver;
 
    ngOnInit() {
        if (!isPlatformBrowser(this.platformId)) return;
 
        // We use a rootMargin that focuses on the top of the viewport where the header sits.
        // -10% at the top means the observer triggers when the element is just below the 10% mark.
        // -85% at the bottom means it stays "active" as long as it occupies the top section.
        const options: IntersectionObserverInit = {
            root: null, // use viewport
            rootMargin: '-80px 0px -90% 0px', // Header height is roughly 80px
            threshold: 0
        };
 
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.headerService.setTheme(this.theme);
                }
            });
        }, options);
 
        this.observer.observe(this.el.nativeElement);
    }
 
    ngOnDestroy() {
        this.observer?.disconnect();
    }
}

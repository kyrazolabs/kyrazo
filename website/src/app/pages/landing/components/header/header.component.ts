import {
    Component,
    computed,
    inject,
    HostListener,
    signal,
} from '@angular/core';
import { dropdownAnimation } from '@shared/animations/dropdown.animation';
import { FormsModule } from '@angular/forms';

import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { StyleClassModule } from 'primeng/styleclass';
import { LayoutService } from '@components/service/layout.service';
import { CommonModule as NgCommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { RouterLink } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { HeaderService } from '@shared/services/header.service';

import { PostHogService } from '@core/3rd-party/posthog';
import { CalendlyService } from '@shared/services/calendly.service';

@Component({
    selector: 'app-landing-header',
    imports: [
        NgCommonModule,
        FormsModule,
        ButtonModule,
        BadgeModule,
        StyleClassModule,
        AvatarModule,
        RouterLink,
        DrawerModule,
    ],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss',
    animations: [dropdownAnimation],
})
export class HeaderComponent {
    private posthog = inject(PostHogService);
    layoutService: LayoutService = inject(LayoutService);
    headerService = inject(HeaderService);
    private calendly = inject(CalendlyService);

    isMobileMenuVisible = signal<boolean>(false);

    isScrolled = false;
    isHeaderHidden = signal(false);
    private lastScrollTop = 0;

    isDarkMode = computed(() => this.layoutService.appState().darkMode);

    @HostListener('window:scroll', [])
    onWindowScroll() {
        const scrollTop = window.scrollY;

        // Logic for translucent/compact header (original logic)
        this.isScrolled = scrollTop > 20;

        // Logic for hide/show on scroll direction
        if (scrollTop > this.lastScrollTop && scrollTop > 100) {
            // Scrolling down
            this.isHeaderHidden.set(true);
        } else {
            // Scrolling up or at the top
            this.isHeaderHidden.set(false);
        }

        this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
    }

    ngOnInit() {}

    toggleDarkMode() {
        this.layoutService.appState.update((state) => ({
            ...state,
            darkMode: !state.darkMode,
        }));
    }

    toggleMobileMenu() {
        this.isMobileMenuVisible.set(!this.isMobileMenuVisible());
    }

    contactSales() {
        this.posthog.capture('header_contact_sales_clicked');
        this.calendly.openDiscoveryPopup();
    }
}

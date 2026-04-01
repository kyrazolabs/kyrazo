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

import { PostHogService } from '@core/3rd-party/posthog';

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

    items: MenuItem[] | undefined;
    activeDropdown = signal<string | null>(null);
    isMobileMenuVisible = signal<boolean>(false);
    private dropdownTimeout: any;

    isScrolled = false;

    isDarkMode = computed(() => this.layoutService.appState().darkMode);

    @HostListener('window:scroll', [])
    onWindowScroll() {
        this.isScrolled = window.scrollY > 20;
    }

    @HostListener('document:click', ['$event'])
    handleClickOutside(event: Event) {
        const target = event.target as HTMLElement;
        if (
            !target.closest('.dropdown-trigger') &&
            !target.closest('.dropdown-menu')
        ) {
            this.activeDropdown.set(null);
        }
    }

    ngOnInit() {
        this.items = [
            {
                label: 'Products',
                icon: 'pi pi-bolt',
                items: [
                    {
                        label: 'Dispatch',
                        icon: 'icon-[hugeicons--rocket-01] size-5',
                        routerLink: '/features/dispatch',
                        command: () => this.activeDropdown.set(null),
                    },
                    {
                        label: 'Ingest',
                        icon: 'icon-[hugeicons--inbox-download] size-5',
                        routerLink: '/features/ingest',
                        command: () => this.activeDropdown.set(null),
                    },
                    {
                        label: 'Architecture',
                        icon: 'icon-[hugeicons--hierarchy-square-02] size-5',
                        routerLink: '/features/architecture',
                        command: () => this.activeDropdown.set(null),
                    },
                    // {
                    //     label: 'Privacy by Design',
                    //     icon: 'icon-[hugeicons--shield-check] size-5',
                    //     routerLink: '/features/privacy-by-design',
                    //     command: () => this.activeDropdown.set(null),
                    // },
                    // {
                    //     label: 'Early Adopter',
                    //     icon: 'icon-[hugeicons--star-01] size-5',
                    //     routerLink: '/features/early-adopter',
                    //     command: () => this.activeDropdown.set(null),
                    // },
                ],
            },
            {
                label: 'Developers',
                icon: 'icon-[hugeicons--code-variable]',
                items: [
                    {
                        label: 'Start in Minutes',
                        icon: 'icon-[hugeicons--zap] size-5',
                        command: () => {
                            window.open(
                                'https://docs.kyrazo.com/quickstart',
                                '_blank',
                            );
                            this.activeDropdown.set(null);
                        },
                    },
                    {
                        label: 'Documentation',
                        icon: 'icon-[hugeicons--book-02] size-5',
                        command: () => {
                            window.open('https://docs.kyrazo.com', '_blank');
                            this.activeDropdown.set(null);
                        },
                    },
                    {
                        label: 'API & SDKs Reference',
                        icon: 'icon-[hugeicons--code-simple] size-5',
                        command: () => {
                            window.open(
                                'https://docs.kyrazo.com/api-reference',
                                '_blank',
                            );
                            this.activeDropdown.set(null);
                        },
                    },
                    {
                        label: 'Changelog',
                        icon: 'pi pi-history',
                        routerLink: '/changelogs',
                        command: () => this.activeDropdown.set(null),
                    },
                ],
            },
            {
                label: 'Pricing',
                icon: 'pi pi-tag',
                routerLink: '/pricing',
            },
            {
                label: 'Blog',
                icon: 'icon-[hugeicons--blogger-03]',
                routerLink: '/blog',
            },
            {
                label: 'Legals',
                icon: 'pi pi-shield',
                items: [
                    {
                        label: 'Privacy Policy',
                        icon: 'icon-[hugeicons--file-locked] size-5',
                        routerLink: '/legal/privacy-policy',
                        command: () => this.activeDropdown.set(null),
                    },
                    {
                        label: 'Refund Policy',
                        icon: 'icon-[hugeicons--file-euro] size-5',
                        routerLink: '/legal/refund-policy',
                        command: () => this.activeDropdown.set(null),
                    },
                    {
                        label: 'Terms of Service',
                        icon: 'icon-[hugeicons--file-verified] size-5',
                        routerLink: '/legal/terms-of-service',
                        command: () => this.activeDropdown.set(null),
                    },
                ],
            },
        ];
    }

    toggleDropdown(event: Event, label: string) {
        event.stopPropagation();
        if (this.activeDropdown() === label) {
            this.activeDropdown.set(null);
        } else {
            this.activeDropdown.set(label);
        }
    }

    onMouseEnter(label: string) {
        if (this.dropdownTimeout) {
            clearTimeout(this.dropdownTimeout);
        }
        this.activeDropdown.set(label);
    }

    onMouseLeave() {
        this.dropdownTimeout = setTimeout(() => {
            this.activeDropdown.set(null);
        }, 150);
    }

    toggleDarkMode() {
        this.layoutService.appState.update((state) => ({
            ...state,
            darkMode: !state.darkMode,
        }));
    }

    toggleMobileMenu() {
        this.isMobileMenuVisible.set(!this.isMobileMenuVisible());
    }
    trackGetStarted() {
        this.posthog.capture('header_get_started_clicked');
        window.open(
            'https://dash.kyrazo.com/auth/register',
            '_top',
            'noopener,noreferrer',
        );
    }

    trackLogin() {
        this.posthog.capture('header_login_clicked');
        window.open(
            'https://dash.kyrazo.com/auth/login',
            '_blank',
            'noopener,noreferrer',
        );
    }
}

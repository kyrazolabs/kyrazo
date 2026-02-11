import {
    Component,
    computed,
    inject,
    HostListener,
    ElementRef,
    ViewChild,
    signal,
} from '@angular/core';
import { dropdownAnimation } from '@shared/animations/dropdown.animation';
import { FormsModule } from '@angular/forms';

import { MenuItem } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { StyleClassModule } from 'primeng/styleclass';
import { LayoutService } from '@components/service/layout.service';
import { CommonModule } from '@angular/common';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { RouterLink } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';

import { AppConfig } from '@components/app.config';
import { PostHogService } from '@core/3rd-party/posthog';

@Component({
    selector: 'app-landing-header',
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        BadgeModule,
        StyleClassModule,
        AppConfig,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
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
    value1: string = '';

    items: MenuItem[] | undefined;
    activeDropdown = signal<string | null>(null);
    isMobileMenuVisible = signal<boolean>(false);
    private dropdownTimeout: any;

    isDarkMode = computed(() => this.layoutService.appState().darkMode);

    isScrolled = false;
    showConfig = false;

    @ViewChild(AppConfig, { read: ElementRef }) configPanel!: ElementRef;
    @ViewChild('settingsButton', { read: ElementRef })
    settingsButton!: ElementRef;

    @HostListener('document:click', ['$event'])
    handleClickOutside(event: Event) {
        if (
            this.showConfig &&
            this.configPanel &&
            this.settingsButton &&
            !this.configPanel.nativeElement.contains(event.target) &&
            !this.settingsButton.nativeElement.contains(event.target)
        ) {
            this.showConfig = false;
        }

        const target = event.target as HTMLElement;
        if (
            !target.closest('.dropdown-trigger') &&
            !target.closest('.dropdown-menu')
        ) {
            this.activeDropdown.set(null);
        }
    }

    @HostListener('window:scroll', [])
    onWindowScroll() {
        this.isScrolled = window.scrollY > 20;
    }

    ngOnInit() {
        this.items = [
            {
                label: 'Products',
                icon: 'pi pi-bolt',
                items: [
                    {
                        label: 'Dispatch',
                        icon: 'icon-[hugeicons--rocket-01]',
                        routerLink: '/features/dispatch',
                        command: () => this.activeDropdown.set(null),
                    },
                    {
                        label: 'Ingest',
                        icon: 'icon-[hugeicons--inbox-download]',
                        routerLink: '/features/ingest',
                        command: () => this.activeDropdown.set(null),
                    },
                    {
                        label: 'Architecture',
                        icon: 'icon-[hugeicons--hierarchy-square-02]',
                        routerLink: '/features/architecture',
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
                icon: 'pi pi-calendar',
                routerLink: '/blog',
            },
            {
                label: 'Changelog',
                icon: 'pi pi-history',
                routerLink: '/changelogs',
            },
            {
                label: 'Documentation',
                icon: 'pi pi-code',
                command: () => {
                    window.open('https://docs.kyrazo.com', '_blank');
                },
            },
            {
                label: 'Legals',
                icon: 'pi pi-shield',
                items: [
                    {
                        label: 'Privacy Policy',
                        icon: 'pi pi-lock',
                        routerLink: '/legal/privacy-policy',
                        command: () => this.activeDropdown.set(null),
                    },
                    {
                        label: 'Refund Policy',
                        icon: 'pi pi-wallet',
                        routerLink: '/legal/policies/refund',
                        command: () => this.activeDropdown.set(null),
                    },
                    {
                        label: 'Terms of Service',
                        icon: 'pi pi-file',
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

    toggleConfig() {
        this.showConfig = !this.showConfig;
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

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
                        command: () => {
                            document
                                .getElementById('features')
                                ?.scrollIntoView({ behavior: 'smooth' });
                            this.activeDropdown.set(null);
                        },
                    },
                    {
                        label: 'Ingest',
                        icon: 'icon-[hugeicons--inbox-download]',
                        command: () => {
                            document
                                .getElementById('features')
                                ?.scrollIntoView({ behavior: 'smooth' });
                            this.activeDropdown.set(null);
                        },
                    },
                    {
                        label: 'Dedicated Workers',
                        icon: 'icon-[hugeicons--server-stack-03]',
                        command: () => {
                            document
                                .getElementById('features')
                                ?.scrollIntoView({ behavior: 'smooth' });
                            this.activeDropdown.set(null);
                        },
                    },
                ],
            },
            {
                label: 'Pricing',
                icon: 'pi pi-tag',
                command: () => {
                    document
                        .getElementById('pricing')
                        ?.scrollIntoView({ behavior: 'smooth' });
                },
            },
            {
                label: 'Documentation',
                icon: 'pi pi-code',
                command: () => {
                    document
                        .getElementById('dev-exp')
                        ?.scrollIntoView({ behavior: 'smooth' });
                },
            },
            {
                label: 'Blog',
                icon: 'pi pi-calendar',
                command: () => {
                    window.open('/blog', '_self');
                },
            },
            {
                label: 'Legals',
                icon: 'pi pi-shield',
                items: [
                    {
                        label: 'Privacy Policy',
                        icon: 'pi pi-lock',
                        routerLink: '/legal/policies/privacy',
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

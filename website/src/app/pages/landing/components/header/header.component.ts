import { Component, computed, inject, HostListener } from '@angular/core';
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
})
export class HeaderComponent {
    private posthog = inject(PostHogService);
    layoutService: LayoutService = inject(LayoutService);
    value1: string = '';

    items: MenuItem[] | undefined;

    isDarkMode = computed(() => this.layoutService.appState().darkMode);

    isScrolled = false;

    @HostListener('window:scroll', [])
    onWindowScroll() {
        this.isScrolled = window.scrollY > 20;
    }

    ngOnInit() {
        this.items = [
            {
                label: 'Features',
                icon: 'pi pi-bolt',
                command: () => {
                    document
                        .getElementById('features')
                        ?.scrollIntoView({ behavior: 'smooth' });
                },
            },
            /* {
        label: "Pricing",
        icon: "pi pi-tag",
        command: () => {
          document
            .getElementById("pricing")
            ?.scrollIntoView({ behavior: "smooth" });
        },
      }, */
            {
                label: 'Developers',
                icon: 'pi pi-code',
                command: () => {
                    document
                        .getElementById('dev-exp')
                        ?.scrollIntoView({ behavior: 'smooth' });
                },
            },
        ];
    }

    toggleDarkMode() {
        this.layoutService.appState.update((state) => ({
            ...state,
            darkMode: !state.darkMode,
        }));
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

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import posthog from 'posthog-js';

@Injectable({
    providedIn: 'root',
})
export class PostHogService {
    private isBrowser: boolean;

    constructor(@Inject(PLATFORM_ID) platformId: any) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    capture(event: string, properties?: any) {
        if (this.isBrowser) {
            posthog.capture(event, properties);
        }
    }

    identify(distinctId: string, properties?: any) {
        if (this.isBrowser) {
            posthog.identify(distinctId, properties);
        }
    }

    alias(alias: string, distinctId: string) {
        if (this.isBrowser) {
            posthog.alias(alias, distinctId);
        }
    }

    reset() {
        if (this.isBrowser) {
            posthog.reset();
        }
    }

    trackPageView() {
        if (this.isBrowser) {
            posthog.capture('$pageview');
        }
    }
}

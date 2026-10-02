import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

declare global {
    interface Window {
        umami?: {
            track: (
                event: string,
                data?: Record<string, string | number>,
            ) => void;
        };
    }
}

@Injectable({
    providedIn: 'root',
})
export class UmamiService {
    private isBrowser: boolean;

    constructor(@Inject(PLATFORM_ID) platformId: object) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    capture(event: string, data?: Record<string, string | number>) {
        if (!this.isBrowser) return;
        window.umami?.track(event, data);
    }
}

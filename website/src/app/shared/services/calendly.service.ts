import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Kyrazo Infrastructure Discovery Call booking link.
 * Theme params keep the widget consistent with the brand (indigo accent, near-black text).
 */
export const CALENDLY_DISCOVERY_URL =
    'https://calendly.com/kyrazo/kyrazo-infrastructure-discovery-call?hide_landing_page_details=1&primary_color=0066ff';

const WIDGET_JS_URL = 'https://assets.calendly.com/assets/external/widget.js';
const WIDGET_CSS_URL = 'https://assets.calendly.com/assets/external/widget.css';

declare global {
    interface Window {
        Calendly?: {
            initPopupWidget: (options: { url: string }) => void;
            initInlineWidgets: () => void;
        };
    }
}

@Injectable({ providedIn: 'root' })
export class CalendlyService {
    private platformId = inject(PLATFORM_ID);
    private isBrowser = isPlatformBrowser(this.platformId);
    private pendingLoad: Promise<void> | null = null;

    /** Opens the Calendly discovery-call booking popup. */
    openDiscoveryPopup(): void {
        if (!this.isBrowser) return;
        this.ensureWidget().then(() => {
            window.Calendly?.initPopupWidget({ url: CALENDLY_DISCOVERY_URL });
        });
    }

    /** Renders any `.calendly-inline-widget` elements present in the DOM. */
    initInlineWidgets(): void {
        if (!this.isBrowser) return;
        this.ensureWidget().then(() => {
            window.Calendly?.initInlineWidgets();
        });
    }

    /**
     * The widget script is loaded from index.html; this waits for it to be
     * ready and self-injects the assets as a fallback if it never arrives.
     */
    private ensureWidget(): Promise<void> {
        if (window.Calendly) return Promise.resolve();
        if (this.pendingLoad) return this.pendingLoad;

        this.pendingLoad = new Promise<void>((resolve) => {
            const startedAt = Date.now();

            const poll = () => {
                if (window.Calendly) {
                    resolve();
                    return;
                }
                // After 5s assume the head tags failed and inject manually.
                if (Date.now() - startedAt > 5000) {
                    injectAssets();
                    // Give the injected script a window to execute.
                    setTimeout(() => resolve(), 1500);
                    return;
                }
                setTimeout(poll, 200);
            };

            poll();
        });

        return this.pendingLoad;
    }
}

function injectAssets(): void {
    if (!document.querySelector(`link[href="${WIDGET_CSS_URL}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = WIDGET_CSS_URL;
        document.head.appendChild(link);
    }
    if (!document.querySelector(`script[src="${WIDGET_JS_URL}"]`)) {
        const script = document.createElement('script');
        script.src = WIDGET_JS_URL;
        script.async = true;
        document.head.appendChild(script);
    }
}

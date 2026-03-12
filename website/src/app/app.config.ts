import {
    APP_INITIALIZER,
    ApplicationConfig,
    ErrorHandler,
    provideBrowserGlobalErrorListeners,
    provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, Router, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import {
    provideClientHydration,
    withEventReplay,
} from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import * as Sentry from '@sentry/angular';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { provideAnimations } from '@angular/platform-browser/animations';
import { environment } from 'environments/environment';
import { definePreset } from '@primeuix/themes';
import { getIndigoPreset } from './theme.config';

const IndigoAura = definePreset(Aura, getIndigoPreset());

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideAnimationsAsync(),
        providePrimeNG({
            ripple: true,
            theme: {
                preset: IndigoAura,
                options: {
                    darkModeSelector: '.p-dark',
                },
            },
        }),
        provideZonelessChangeDetection(),
        provideRouter(
            routes,
            withInMemoryScrolling({ scrollPositionRestoration: 'disabled' }),
        ),
        provideAnimations(),
        provideHttpClient(withFetch()),
        provideClientHydration(withEventReplay()),
    ],
    ...(environment.sentry.enabled
        ? [
              {
                  provide: ErrorHandler,
                  useValue: Sentry.createErrorHandler(),
              },
              {
                  provide: Sentry.TraceService,
                  deps: [Router],
              },
              {
                  provide: APP_INITIALIZER,
                  useFactory: () => () => {},
                  deps: [Sentry.TraceService],
                  multi: true,
              },
          ]
        : []),
};

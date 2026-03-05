import {
    APP_INITIALIZER,
    ApplicationConfig,
    ErrorHandler,
    provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, Router, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import * as Sentry from '@sentry/angular';
import { routes } from './app.routes';
import { environment } from '../environments/environment';

import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationService, MessageService } from 'primeng/api';

import { authInterceptor } from '@core/interceptors/auth.interceptor';
// import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { namespaceInterceptor } from '@core/interceptors/namespace.interceptor';
import { retryInterceptor } from '@core/interceptors/retry.interceptor';
import { workspaceInterceptor } from '@core/interceptors/workspace.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        provideAnimationsAsync(),
        providePrimeNG({
            ripple: true,
            theme: {
                preset: Aura,
                options: { darkModeSelector: false || '.p-dark' },
            },
        }),
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(
            routes,
            withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
        ),
        provideAnimations(),
        provideHttpClient(
            withInterceptors([
                authInterceptor,
                namespaceInterceptor,
                retryInterceptor,
                workspaceInterceptor,
            ]),
        ),
        MessageService,
        ConfirmationService,
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
    ],
};

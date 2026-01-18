import { bootstrapApplication } from "@angular/platform-browser";
import * as Sentry from "@sentry/angular";
import posthog from "posthog-js";

import { appConfig } from "./app/app.config";
import { AppComponent } from "./app/app.component";
import { environment } from "./environments/environment";

if (environment.posthog.key) {
  posthog.init(environment.posthog.key, {
    api_host: environment.posthog.host,
    person_profiles: "identified_only",
    capture_pageview: false, // Handled manually in components
  });
}

if (environment.sentry.enabled) {
  Sentry.init({
    dsn: environment.sentry.dsn,
    environment: environment.production ? "production" : "development",
    // Point to the Nginx tunnel
    tunnel: "/sentry/",

    integrations: [Sentry.browserTracingIntegration()],

    tracesSampleRate: 1.0,
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
  });
}

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err),
);

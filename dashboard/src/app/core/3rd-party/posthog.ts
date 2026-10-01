import { Injectable } from "@angular/core";
import posthog from "posthog-js";

@Injectable({
  providedIn: "root",
})
export class PostHogService {
  constructor() {}

  capture(event: string, properties?: any) {
    posthog.capture(event, properties);
  }

  identify(distinctId: string, properties?: any) {
    posthog.identify(distinctId, properties);
  }

  alias(alias: string, distinctId: string) {
    posthog.alias(alias, distinctId);
  }

  reset() {
    posthog.reset();
  }

  trackPageView() {
    posthog.capture("$pageview");
  }
}

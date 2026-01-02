import { Injectable } from "@angular/core";
import * as Sentry from "@sentry/angular";

@Injectable({
  providedIn: "root",
})
export class SentryService {
  /**
   * Captures an exception and sends it to Sentry.
   * @param exception The exception to capture.
   * @param hint Optional hint for the exception.
   */
  captureException(exception: any, hint?: Sentry.EventHint): string {
    return Sentry.captureException(exception, hint);
  }

  /**
   * Captures a message and sends it to Sentry.
   * @param message The message to capture.
   * @param level Optional severity level.
   * @param hint Optional hint for the message.
   */
  captureMessage(
    message: string,
    level?: Sentry.SeverityLevel,
    hint?: Sentry.EventHint
  ): string {
    return Sentry.captureMessage(message, { level, ...hint });
  }

  /**
   * Sets the user context for subsequent events.
   * @param user The user object or null to clear.
   */
  setUser(user: Sentry.User | null): void {
    Sentry.setUser(user);
  }

  /**
   * Adds a breadcrumb to the current scope.
   * @param breadcrumb The breadcrumb to add.
   */
  addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    Sentry.addBreadcrumb(breadcrumb);
  }

  /**
   * Sets a tag on the current scope.
   * @param key The tag key.
   * @param value The tag value.
   */
  setTag(key: string, value: string): void {
    Sentry.setTag(key, value);
  }
}

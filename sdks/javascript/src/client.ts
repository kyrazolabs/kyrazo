/**
 * Kyrazo SDK Client
 */

import { type KyrazoConfig, resolveConfig } from "./config";
import { ValidationError } from "./errors";
import { HttpClient } from "./utils/http";
import { createEventsModule, type EventsModule } from "./modules/events/index";
import {
  createSourcesModule,
  type SourcesModule,
} from "./modules/sources/index";
import {
  createEndpointsModule,
  type EndpointsModule,
} from "./modules/endpoints/index";
import {
  createTargetsModule,
  type TargetsModule,
} from "./modules/targets/index";

/**
 * Kyrazo SDK Client
 *
 * @example
 * ```ts
 * const kyrazo = new Kyrazo({
 *   apiKey: "your-api-key",
 *   baseURL: "http://localhost:4000"
 * });
 *
 * const response = await kyrazo.events.single("project-123", {
 *   eventType: "user.created",
 *   webhookId: "webhook-456",
 *   workspaceId: "workspace-789",
 *   payload: { userId: "u_123" },
 *   targets: [{ targetUrl: "https://example.com/webhook" }]
 * });
 * ```
 */
export class Kyrazo {
  /**
   * Events module for publishing events
   */
  public readonly events: EventsModule;

  /**
   * Sources module for managing event sources
   */
  public readonly sources: SourcesModule;

  /**
   * Endpoints module for managing endpoints
   */
  public readonly endpoints: EndpointsModule;

  /**
   * Targets module for managing webhook targets
   */
  public readonly targets: TargetsModule;

  /**
   * The HTTP client used for requests
   */
  private readonly httpClient: HttpClient;

  /**
   * Resolved configuration
   */
  private readonly config: ReturnType<typeof resolveConfig>;

  /**
   * Create a new Kyrazo SDK instance
   *
   * @param config - SDK configuration options
   */
  constructor(config: KyrazoConfig) {
    // Validate API key
    if (!config.apiKey || typeof config.apiKey !== "string") {
      throw new ValidationError(
        "apiKey is required and must be a non-empty string",
      );
    }

    // Resolve configuration with defaults
    this.config = resolveConfig(config);

    // Create HTTP client
    this.httpClient = new HttpClient(this.config);

    // Initialize modules
    this.events = createEventsModule(this.httpClient);
    this.sources = createSourcesModule(this.httpClient);
    this.endpoints = createEndpointsModule(this.httpClient);
    this.targets = createTargetsModule(this.httpClient);
  }

  /**
   * Get the current SDK configuration
   */
  getConfig(): Readonly<typeof this.config> {
    return Object.freeze({ ...this.config });
  }
}

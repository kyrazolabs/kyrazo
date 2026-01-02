import { Component, ViewChild, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";

import { TableModule, Table, TableLazyLoadEvent } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { SelectModule } from "primeng/select";
import { TagModule } from "primeng/tag";
import { InputTextModule } from "primeng/inputtext";
import { TooltipModule } from "primeng/tooltip";
import { CardModule } from "primeng/card";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { SkeletonModule } from "primeng/skeleton";
import { ProgressBarModule } from "primeng/progressbar";
import { SentryService } from "@core/3rd-party/sentry";
import { PostHogService } from "@core/3rd-party/posthog";

import { DeliveryService } from "@core/services/delivery.service";
import { LoaderService } from "@core/services/loader.service";
import { GetDAResponse, TargetStatus } from "@models/delivery.types";
import { IngestEvent } from "@core/services/delivery.service";
import { SourceType } from "@models/source.types";

// Interface for display purposes (mapping GetDAResponse to display format)
interface Delivery {
  _id: string;
  id: string;
  delivery_id: string;
  endpoint: string;
  endpointName?: string;
  eventType?: string;
  status: string;
  responseCode: string;
  latencyMs?: number;
  attempts?: number;
  timestamp: string;
  sourceId: string;
  source_type: string;
  target: string;
  attempt_number?: number;
  processed_at?: string;
  response_time_ms?: number;
  response_code?: number;
}

@Component({
  selector: "app-logs.page",
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TableModule,
    ButtonModule,
    SelectModule,
    TagModule,
    InputTextModule,
    TooltipModule,
    CardModule,
    ProgressSpinnerModule,
    IconFieldModule,
    InputIconModule,
    SkeletonModule,
    ProgressBarModule,
  ],
  templateUrl: "./logs.page.html",
  styleUrl: "./logs.page.scss",
})
export class LogsPage implements OnInit {
  @ViewChild("dt") dt!: Table;

  public loader = inject(LoaderService);
  private readonly deliveryService = inject(DeliveryService);
  private readonly sentry = inject(SentryService);
  private readonly posthog = inject(PostHogService);

  // Core data arrays
  ingestEvents: IngestEvent[] = [];
  filteredIngestEvents: IngestEvent[] = [];

  // Stats data
  ingestStats: {
    total_events: number;
    successful_events: number;
    failed_events: number;
    pending_events: number;
    success_rate: number;
  } | null = null;

  // Filter states
  activeFilter: string = "all";
  selectedStatus: string | undefined;
  searchTerm = "";

  statusOptions = [
    { label: "Processed", value: "processed" },
    { label: "Failed", value: "failed" },
    { label: "Pending", value: "pending" },
  ];

  // Pagination properties
  totalRecords = 0;
  rows = 10;
  currentPage = 1;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Load stats on component initialization
    this.loadStats();
  }

  // Convert GetDAResponse to Delivery for display
  private mapToDelivery(da: GetDAResponse): Delivery {
    return {
      _id: da.delivery_id,
      id: da.delivery_id,
      delivery_id: da.delivery_id,
      endpoint: da.target,
      eventType: da.event_id ? da.event_type : "Unknown Event",
      status: da.status,
      responseCode: da.response_code ? da.response_code.toString() : "-",
      latencyMs: da.response_time_ms,
      attempts: da.attempt_number,
      timestamp: da.processed_at || da.scheduled_at || "",
      sourceId: da.webhook_id,
      source_type: da.webhook_type || "unknown",
      target: da.target,
      attempt_number: da.attempt_number,
      processed_at: da.processed_at,
      response_time_ms: da.response_time_ms,
      response_code: da.response_code,
    };
  }

  loadIngestEvents(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: "pending" | "processed" | "failed"
  ) {
    this.loader.show();

    const queryParams: {
      q?: string;
      status?: "pending" | "processed" | "failed";
      page?: number;
      limit?: number;
    } = { page, limit };
    if (search) queryParams.q = search;
    if (status) queryParams.status = status;

    this.deliveryService
      .getIngestEvents(queryParams)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (response) => {
          this.ingestEvents = response.data || [];
          console.log(this.ingestEvents);

          this.totalRecords =
            Number(response.pagination?.total) || this.ingestEvents.length;
          this.applyClientSideFiltering();
        },
        error: (err) => {
          this.sentry.captureException(err);
          this.posthog.capture("ingest_logs_load_error", {
            error: err.message,
          });
          console.error(err);

          this.ingestEvents = [];
          this.totalRecords = 0;
          this.filteredIngestEvents = [];
        },
      });
  }

  loadStats() {
    // For ingest logs, we don't have a separate stats endpoint yet
    // We could calculate stats from the loaded events or use analytics
    this.ingestStats = null;
  }

  private applyClientSideFiltering() {
    let filtered = [...this.ingestEvents];

    // Apply status filter
    if (this.activeFilter !== "all") {
      filtered = filtered.filter(
        (event) => event.processing_status === this.activeFilter
      );
    }

    // Apply search filter
    if (this.searchTerm) {
      const query = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.event_id.toLowerCase().includes(query) ||
          event.source.toLowerCase().includes(query) ||
          event.source.toLowerCase().includes(query)
      );
    }

    // Use events directly for display
    this.filteredIngestEvents = filtered;
  }

  loadIngestEventsLazy(event: TableLazyLoadEvent) {
    const page = event.first! / event.rows! + 1;
    const limit = event.rows!;
    this.loadIngestEvents(
      page,
      limit,
      this.searchTerm,
      this.activeFilter === "all"
        ? undefined
        : (this.activeFilter as "pending" | "processed" | "failed")
    );
  }

  filterByStatus(status: string) {
    this.activeFilter = status as "all" | "pending" | "processed" | "failed";
    this.posthog.capture("ingest_logs_filtered", { status });
    this.loadIngestEvents(
      1,
      this.rows,
      this.searchTerm,
      status === "all"
        ? undefined
        : (status as "pending" | "processed" | "failed")
    );
  }

  onSearchInput(event: any) {
    this.searchTerm = event.target.value;
    if (this.searchTerm.length >= 3) {
      this.posthog.capture("ingest_logs_searched", { query: this.searchTerm });
    }
    this.loadIngestEvents(
      1,
      this.rows,
      this.searchTerm,
      this.activeFilter === "all"
        ? undefined
        : (this.activeFilter as "pending" | "processed" | "failed")
    );
  }

  applyFilters() {
    this.activeFilter = this.selectedStatus || "all";
    this.loadIngestEvents(
      1,
      this.rows,
      this.searchTerm,
      this.activeFilter === "all"
        ? undefined
        : (this.activeFilter as "pending" | "processed" | "failed")
    );
  }

  clearFilters() {
    this.selectedStatus = undefined;
    this.searchTerm = "";
    this.activeFilter = "all";
    this.applyClientSideFiltering();
  }

  hasFilters(): boolean {
    return !!(
      this.selectedStatus ||
      this.searchTerm.trim() ||
      this.activeFilter !== "all"
    );
  }

  refreshIngestEvents() {
    this.selectedStatus = undefined;
    this.searchTerm = "";
    this.activeFilter = "all";
    this.loadIngestEvents();
    this.loadStats();
  }

  // Ingest events don't have retry functionality like deliveries

  onPageChange(event: any) {
    this.currentPage = event.page + 1;
    this.rows = event.rows;
    // If implementing server-side pagination, call loadDeliveries here
    // this.loadDeliveries(this.currentPage, this.rows);
  }

  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" {
    switch (status) {
      case "delivered":
        return "success";
      case "failed":
        return "danger";
      case "pending":
        return "warn";
      case "processing":
        return "info";
      case "timeout":
        return "warn";
      case "network_error":
        return "danger";
      default:
        return "info";
    }
  }

  formatTimestamp(timestamp: string): string {
    if (!timestamp) return "Never";
    const dateObj = new Date(timestamp);
    return dateObj.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  // Stats methods - for now return counts from loaded events
  getTotalCount(): number {
    return this.ingestEvents.length;
  }

  getSuccessCount(): number {
    return this.ingestEvents.filter((e) => e.processing_status === "processed")
      .length;
  }

  getFailedCount(): number {
    return this.ingestEvents.filter((e) => e.processing_status === "failed")
      .length;
  }

  getSuccessRate(): number {
    const total = this.ingestEvents.length;
    if (total === 0) return 0;
    return Math.round((this.getSuccessCount() / total) * 100 * 100) / 100;
  }
}

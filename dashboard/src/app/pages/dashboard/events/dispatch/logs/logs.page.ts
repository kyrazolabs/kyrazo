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
import {
  GetDAResponse,
  IDeliveryAttempt,
  TargetStatus,
} from "@models/delivery.types";
import { SourceType } from "@models/source.types";
import { ApiResponse } from "@models/index";

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
  webhookId: string;
  webhook_type: string;
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

  // Track if initial data has been loaded from resolver
  private initialDataLoaded = false;

  // Core data arrays
  deliveries: GetDAResponse[] = [];
  filteredDeliveries: Delivery[] = [];

  // Filter states
  activeFilter: string = "all";
  selectedStatus: string | undefined;
  searchTerm = "";

  statusOptions = [
    { label: "Success", value: "delivered" },
    { label: "Failed", value: "failed" },
    { label: "Pending", value: "pending" },
    { label: "Processing", value: "processing" },
    { label: "Timeout", value: "timeout" },
    { label: "Network Error", value: "network_error" },
  ];

  // Pagination properties
  totalRecords = 0;
  rows = 10;
  currentPage = 1;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Load data from resolver (no API call here)
    const data = this.route.snapshot.data["data"] as ApiResponse<
      GetDAResponse[]
    >;
    this.deliveries = data.data || [];
    this.totalRecords =
      Number(data.pagination?.total) || this.deliveries.length;
    this.initialDataLoaded = true;
    this.applyClientSideFiltering();

    // Don't call loadStats() here to avoid duplicate requests
    // Load stats only when explicitly needed (e.g., refresh button)
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
      webhookId: da.webhook_id,
      webhook_type: da.webhook_type || "unknown",
      target: da.target,
      attempt_number: da.attempt_number,
      processed_at: da.processed_at,
      response_time_ms: da.response_time_ms,
      response_code: da.response_code,
    };
  }

  loadDeliveries(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: TargetStatus,
    forceApiCall: boolean = false
  ) {
    // Skip API call if we have initial data and no force flag is set
    if (
      this.initialDataLoaded &&
      !forceApiCall &&
      !search &&
      !status &&
      page === 1 &&
      limit === this.rows
    ) {
      // Use existing data for basic operations when initial data is loaded
      this.applyClientSideFiltering();
      return;
    }

    this.loader.show();

    const queryParams: {
      q?: string;
      status?: TargetStatus;
      page?: number;
      limit?: number;
    } = { page, limit };
    if (search) queryParams.q = search;
    if (status) queryParams.status = status;

    // API call for searches, filters, or pagination
    this.deliveryService
      .gets(queryParams)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (response) => {
          this.deliveries = response.data || [];
          this.totalRecords =
            Number(response.pagination?.total) || this.deliveries.length;
          this.applyClientSideFiltering();
        },
        error: (err) => {
          this.sentry.captureException(err);
          this.posthog.capture("dispatch_logs_load_error", {
            error: err.message,
          });
          console.error(err);

          this.deliveries = [];
          this.totalRecords = 0;
          this.filteredDeliveries = [];
        },
      });
  }

  private applyClientSideFiltering() {
    let filtered = [...this.deliveries];

    // Apply status filter
    if (this.activeFilter !== "all") {
      filtered = filtered.filter(
        (delivery) => delivery.status === (this.activeFilter as TargetStatus)
      );
    }

    // Apply search filter
    if (this.searchTerm) {
      const query = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (delivery) =>
          delivery.delivery_id.toLowerCase().includes(query) ||
          delivery.target.toLowerCase().includes(query) ||
          delivery.event_id.toLowerCase().includes(query) ||
          (delivery.response_code?.toString().toLowerCase().includes(query) ??
            false)
      );
    }

    // Convert to display format
    this.filteredDeliveries = filtered.map((da) => this.mapToDelivery(da));
  }

  loadDeliveriesLazy(event: TableLazyLoadEvent) {
    const page = event.first! / event.rows! + 1;
    const limit = event.rows!;
    if (this.deliveries) {
      // Force API call for pagination since we're changing pages
      this.loadDeliveries(
        page,
        limit,
        this.searchTerm,
        this.activeFilter === "all"
          ? undefined
          : (this.activeFilter as TargetStatus),
        true
      );
    }
  }

  filterByStatus(status: string) {
    this.activeFilter = status as "all" | TargetStatus;
    this.posthog.capture("dispatch_logs_filtered", { status });
    // Force API call for status filtering
    this.loadDeliveries(
      1,
      this.rows,
      this.searchTerm,
      status === "all" ? undefined : (status as TargetStatus),
      true
    );
  }

  onSearchInput(event: any) {
    this.searchTerm = event.target.value;
    if (this.searchTerm.length >= 3) {
      this.posthog.capture("dispatch_logs_searched", {
        query: this.searchTerm,
      });
    }
    // Force API call for search
    this.loadDeliveries(
      1,
      this.rows,
      this.searchTerm,
      this.activeFilter === "all"
        ? undefined
        : (this.activeFilter as TargetStatus),
      true
    );
  }

  applyFilters() {
    this.activeFilter = this.selectedStatus || "all";
    // Force API call for filter application
    this.loadDeliveries(
      1,
      this.rows,
      this.searchTerm,
      this.activeFilter === "all"
        ? undefined
        : (this.activeFilter as TargetStatus),
      true
    );
  }

  clearFilters() {
    this.selectedStatus = undefined;
    this.searchTerm = "";
    this.activeFilter = "all";
    // Use client-side filtering for clearing filters (no API call needed)
    this.applyClientSideFiltering();
  }

  hasFilters(): boolean {
    return !!(
      this.selectedStatus ||
      this.searchTerm.trim() ||
      this.activeFilter !== "all"
    );
  }

  refreshDeliveries() {
    this.selectedStatus = undefined;
    this.searchTerm = "";
    this.activeFilter = "all";
    // Force API call for refresh
    this.loadDeliveries(1, this.rows, "", undefined, true);
  }

  retryDelivery(deliveryId: string) {
    this.posthog.capture("dispatch_retry_attempted", {
      delivery_id: deliveryId,
    });
    // TODO: Implement retry functionality with the service
    console.log("Retrying delivery:", deliveryId);

    // Simulate retry for now
    const deliveryIndex = this.deliveries.findIndex(
      (d) => d.delivery_id === deliveryId
    );
    if (deliveryIndex !== -1) {
      this.deliveries[deliveryIndex] = {
        ...this.deliveries[deliveryIndex],
        status: "pending" as TargetStatus,
        attempt_number: this.deliveries[deliveryIndex].attempt_number + 1,
      };
      this.applyClientSideFiltering();
    }
  }

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

  // Stats methods calculated from resolver data (no additional API calls needed)
  getTotalCount(): number {
    return this.deliveries.length;
  }

  getSuccessCount(): number {
    return this.deliveries.filter((d) => d.status === "delivered").length;
  }

  getFailedCount(): number {
    return this.deliveries.filter((d) => d.status === "failed").length;
  }

  getSuccessRate(): number {
    const total = this.deliveries.length;
    const successful = this.getSuccessCount();
    return total > 0 ? Math.round((successful / total) * 100) : 0;
  }
}

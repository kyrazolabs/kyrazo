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

import { DeliveryService } from "@core/services/delivery.service";
import { LoaderService } from "@core/services/loader.service";
import { GetDAResponse, TargetStatus } from "@models/delivery.types";
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
  webhookId: string;
  webhook_type: string;
  target: string;
  attempt_number?: number;
  processed_at?: string;
  response_time_ms?: number;
  response_code?: number;
}

@Component({
  selector: "app-delivery-list",
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
  templateUrl: "./delivery-list.page.html",
  styleUrl: "./delivery-list.page.scss",
})
export class DeliveryListPage implements OnInit {
  @ViewChild("dt") dt!: Table;

  public loader = inject(LoaderService);
  private readonly deliveryService = inject(DeliveryService);
  private readonly sentry = inject(SentryService);

  // Core data arrays
  deliveries: GetDAResponse[] = [];
  filteredDeliveries: Delivery[] = [];

  // Stats data
  deliveryStats: {
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    successRate: number;
  } | null = null;

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
      eventType: da.event_id
        ? "Event " + da.event_id.substring(0, 8)
        : "Unknown Event",
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
    status?: TargetStatus
  ) {
    this.loader.show();

    const queryParams: {
      q?: string;
      status?: TargetStatus;
      page?: number;
      limit?: number;
    } = { page, limit };
    if (search) queryParams.q = search;
    if (status) queryParams.status = status;

    // Assuming deliveryService has a gets method similar to webhooks
    this.deliveryService
      .gets(queryParams)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (response) => {
          this.deliveries = response.data || [];
          console.log(this.deliveries);

          this.totalRecords =
            Number(response.pagination?.total) || this.deliveries.length;
          this.applyClientSideFiltering();
        },
        error: (err) => {
          this.sentry.captureException(err);
          console.error(err);
          this.deliveries = [];
          this.totalRecords = 0;
          this.filteredDeliveries = [];
        },
      });
  }

  loadStats() {
    this.deliveryService.getStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.deliveryStats = response.data;
        }
      },
      error: (err) => {
        this.sentry.captureException(err);
        console.error("Failed to load delivery stats:", err);
        this.deliveryStats = null;
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
    this.loadDeliveries(
      page,
      limit,
      this.searchTerm,
      this.activeFilter === "all"
        ? undefined
        : (this.activeFilter as TargetStatus)
    );
  }

  filterByStatus(status: string) {
    this.activeFilter = status as "all" | TargetStatus;
    this.loadDeliveries(
      1,
      this.rows,
      this.searchTerm,
      status === "all" ? undefined : (status as TargetStatus)
    );
  }

  onSearchInput(event: any) {
    this.searchTerm = event.target.value;
    this.loadDeliveries(
      1,
      this.rows,
      this.searchTerm,
      this.activeFilter === "all"
        ? undefined
        : (this.activeFilter as TargetStatus)
    );
  }

  applyFilters() {
    this.activeFilter = this.selectedStatus || "all";
    this.loadDeliveries(
      1,
      this.rows,
      this.searchTerm,
      this.activeFilter === "all"
        ? undefined
        : (this.activeFilter as TargetStatus)
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

  refreshDeliveries() {
    this.selectedStatus = undefined;
    this.searchTerm = "";
    this.activeFilter = "all";
    this.loadDeliveries();
    this.loadStats();
  }

  retryDelivery(deliveryId: string) {
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

  // Stats methods using API data
  getTotalCount(): number {
    return this.deliveryStats?.totalDeliveries || 0;
  }

  getSuccessCount(): number {
    return this.deliveryStats?.successfulDeliveries || 0;
  }

  getFailedCount(): number {
    return this.deliveryStats?.failedDeliveries || 0;
  }

  getSuccessRate(): number {
    return this.deliveryStats?.successRate || 0;
  }
}

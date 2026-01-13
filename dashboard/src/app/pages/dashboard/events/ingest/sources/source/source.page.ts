import {
  Component,
  inject,
  OnInit,
  signal,
  ViewChild,
  AfterViewInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";

// PrimeNG Imports
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { ChipModule } from "primeng/chip";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { DividerModule } from "primeng/divider";
import { BadgeModule } from "primeng/badge";
import { TableModule, Table, TableLazyLoadEvent } from "primeng/table";
import { InputTextModule } from "primeng/inputtext";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { TooltipModule } from "primeng/tooltip";
import { SelectModule } from "primeng/select";
import { ToastModule } from "primeng/toast";
import { MessageService } from "primeng/api";

import { LoaderService } from "@core/services/loader.service";

// Models and Services
import { ISource, SourceStatus, SourceType } from "@models/source.types";
import { IEndpoint } from "@models/endpoint.types";
import {
  GetDAWResponse,
  IDeliveryAttempt,
  TargetStatus,
} from "@models/delivery.types";
import { IngestEvent } from "@core/services/delivery.service";
import { SourceService } from "@core/services/source.service";
import { DeliveryService } from "@core/services/delivery.service";
import { environment } from "environments/environment";
import { SentryService } from "@core/3rd-party/sentry";

interface DeliveryStats {
  total: number;
  successful: number;
  failed: number;
  pending: number;
}

@Component({
  selector: "app-source.page",
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    // PrimeNG Modules
    CardModule,
    ButtonModule,
    ChipModule,
    TabsModule,
    TagModule,
    ProgressSpinnerModule,
    DividerModule,
    BadgeModule,
    TableModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    SelectModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: "./source.page.html",
  styleUrl: "./source.page.scss",
})
export class SourcePage implements OnInit, AfterViewInit {
  @ViewChild("dt") dt!: Table;

  public loader = inject(LoaderService);
  private deliveryService = inject(DeliveryService);
  private route = inject(ActivatedRoute);
  private sourceService = inject(SourceService);

  public mes = inject(MessageService);
  private sentry = inject(SentryService);

  // Signals for reactive data
  source = signal<ISource | null>(null);
  endpoints = signal<IEndpoint[]>([]);
  ingestEvents = signal<IngestEvent[]>([]);
  ingestStats = signal<DeliveryStats>({
    total: 0,
    successful: 0,
    failed: 0,
    pending: 0,
  });
  loading = signal(false);
  ingressUrl = signal<string>("");
  secret = signal<string>("");

  // Table properties
  filteredIngestEvents: IngestEvent[] = [];
  totalRecords = 0;
  rows = 10;
  currentPage = 1;
  searchTerm = "";
  activeFilter: string = "all";
  tableLoading = false;

  ngOnInit() {
    // Get source data from route (could be passed via resolver)
    const sourceId = this.route.snapshot.paramMap.get("id");
    if (sourceId) {
      this.loadSourceData(sourceId);
    } else {
    }
  }

  ngAfterViewInit() {
    // Table is ready
  }

  private loadSourceData(sourceId: string) {
    this.loading.set(true);

    // Load source details
    this.sourceService.get(sourceId).subscribe({
      next: (response) => {
        this.source.set(response.data);
        this.endpoints.set(response.data.endpoints || []);

        if (response.data.ingressId) {
          this.ingressUrl.set(
            environment.ingest.ingress(response.data.ingressId)
          );
        }

        // Safely access nested secret if available
        const auth = (response.data as any).authentication;
        if (auth?.service?.secret) {
          this.secret.set(auth.service.secret);
        }

        this.loading.set(false);
        // Load ingest events after source is loaded
        this.loadIngestEvents();
      },
      error: (error) => {
        this.sentry.captureException(error);
        console.error("Error loading source:", error);
        this.loading.set(false);
        // Fallback to mock data
      },
    });
  }

  toggleStatus() {
    const source = this.source();
    if (!source) return;

    const newStatus =
      source.status === SourceStatus.ACTIVE
        ? SourceStatus.INACTIVE
        : SourceStatus.ACTIVE;
    this.sourceService.update(source._id, { status: newStatus }).subscribe({
      next: (updatedSource) => {
        this.source.set(updatedSource.data.source);
        this.mes.add({
          severity: "success",
          summary: "Success",
          detail: `Source ${
            newStatus === SourceStatus.ACTIVE ? "activated" : "paused"
          } successfully`,
        });
      },
      error: (error) => {
        this.sentry.captureException(error);
        console.error("Error updating source status:", error);
        this.mes.add({
          severity: "error",
          summary: "Error",
          detail: "Failed to update source status",
        });
      },
    });
  }

  getDeliveryTagSeverity(
    status: string
  ): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    switch (status) {
      case "success":
        return "success";
      case "failed":
        return "danger";
      case "pending":
        return "info";
      default:
        return "secondary";
    }
  }

  // TrackBy functions for better performance
  trackByEventType(index: number, eventType: string): string {
    return eventType;
  }

  trackByEndpoint(index: number, endpoint: IEndpoint): string {
    return endpoint._id;
  }

  trackByDelivery(index: number, delivery: GetDAWResponse): string {
    return delivery.delivery_id;
  }

  loadIngestEvents(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: "pending" | "processed" | "failed"
  ) {
    const source = this.source();
    if (!source) return;

    this.tableLoading = true;

    // Use the delivery service to get ingest events by source
    this.deliveryService
      .getReceivedEventsBySource(source._id, { page, limit })
      .pipe(finalize(() => (this.tableLoading = false)))
      .subscribe({
        next: (response) => {
          const events = response.data || [];
          this.ingestEvents.set(events);
          this.totalRecords = response.pagination?.total || events.length;

          // Calculate stats from loaded events
          const total = events.length;
          const successful = events.filter(
            (e) => e.processing_status === "processed"
          ).length;
          const failed = events.filter(
            (e) => e.processing_status === "failed"
          ).length;
          const pending = events.filter(
            (e) => e.processing_status === "pending"
          ).length;
          this.ingestStats.set({ total, successful, failed, pending });

          this.applyClientSideFiltering();
        },
        error: (err) => {
          this.sentry.captureException(err);
          console.error("Error loading ingest events:", err);
          this.ingestEvents.set([]);
          this.filteredIngestEvents = [];
          this.totalRecords = 0;
          this.ingestStats.set({
            total: 0,
            successful: 0,
            failed: 0,
            pending: 0,
          });
        },
      });
  }

  private applyClientSideFiltering() {
    let filtered = [...this.ingestEvents()];

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
    this.loadIngestEvents(
      1,
      this.rows,
      this.searchTerm,
      this.activeFilter === "all"
        ? undefined
        : (this.activeFilter as "pending" | "processed" | "failed")
    );
  }

  refreshIngestEvents() {
    this.searchTerm = "";
    this.activeFilter = "all";
    this.loadIngestEvents();
  }

  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" {
    switch (status) {
      case "processed":
        return "success";
      case "failed":
        return "danger";
      case "pending":
        return "warn";
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

  async copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      this.mes.add({
        severity: "success",
        summary: "Copied to clipboard",
        life: 2000,
      });
    } catch {
      this.mes.add({
        severity: "error",
        summary: "Failed to copy",
        life: 2000,
      });
    }
  }
}

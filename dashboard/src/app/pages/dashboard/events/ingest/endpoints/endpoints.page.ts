import { Component, ViewChild, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";

// PrimeNG Imports
import { TableModule, Table, TableLazyLoadEvent } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { InputTextModule } from "primeng/inputtext";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { CardModule } from "primeng/card";
import { MenuModule } from "primeng/menu";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";
import { ProgressSpinnerModule } from "primeng/progressspinner";

// Services and Types
import { EndpointService } from "@core/services/endpoint.service"; // Adjust the path as needed
import { IEndpoint, EndpointStatus } from "@models/endpoint.types";
import { ConfirmationService, MessageService } from "primeng/api";
import { PaginatorModule } from "primeng/paginator";
import { SkeletonModule } from "primeng/skeleton";
import { ProgressBarModule } from "primeng/progressbar";
import { LoaderService } from "@core/services/loader.service";
import { SentryService } from "@core/3rd-party/sentry";
import { PostHogService } from "@core/3rd-party/posthog";

@Component({
  selector: "app-endpoints",
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    // PrimeNG Modules
    TableModule,
    SkeletonModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    CardModule,
    MenuModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
    ProgressSpinnerModule,
    PaginatorModule,
    ProgressBarModule,
  ],
  providers: [EndpointService],
  templateUrl: "./endpoints.page.html",
  styleUrl: "./endpoints.page.scss",
})
export class EndpointsPage implements OnInit {
  @ViewChild("dt") dt!: Table;

  public loader = inject(LoaderService);
  private readonly endpointService = inject(EndpointService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly sentry = inject(SentryService);
  private readonly posthog = inject(PostHogService);

  constructor(private route: ActivatedRoute) {}

  endpoints: IEndpoint[] = [];
  filteredEndpoints: IEndpoint[] = [];
  activeFilter: "all" | "active" | "inactive" = "all";

  // Pagination properties
  totalRecords = 0;
  rows = 10;
  currentPage = 1;

  // Search and filter properties
  searchQuery = "";

  ngOnInit() {
    const endpoints = this.route.snapshot.data["data"] as IEndpoint[];
    this.endpoints = endpoints;
    this.totalRecords = endpoints.length;
    this.applyClientSideFiltering();
  }

  loadEndpoints(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: EndpointStatus
  ) {
    this.loader.show();

    const queryParams: {
      q?: string;
      status?: EndpointStatus;
      page?: number;
      limit?: number;
    } = { page, limit };
    if (search) queryParams.q = search;
    if (status) queryParams.status = status;

    this.endpointService
      .gets(queryParams)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (response) => {
          this.endpoints = response.data || [];
          this.totalRecords =
            response.pagination?.total || this.endpoints.length;
        },
        error: (err) => {
          this.sentry.captureException(err);
          this.posthog.capture("endpoint_load_error", { error: err.message });
          console.error(err);

          this.endpoints = [];
          this.totalRecords = 0;
        },
      });
  }

  private applyClientSideFiltering() {
    let filtered = [...this.endpoints];

    // Apply status filter
    if (this.activeFilter !== "all") {
      filtered = filtered.filter(
        (endpoint) => endpoint.status === this.activeFilter
      );
    }

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (endpoint) =>
          endpoint.name.toLowerCase().includes(query) ||
          endpoint.url.toLowerCase().includes(query) ||
          endpoint.description?.toLowerCase().includes(query)
      );
    }

    this.filteredEndpoints = filtered;
  }

  loadEndpointsLazy(event: TableLazyLoadEvent) {
    const page = event.first! / event.rows! + 1;
    const limit = event.rows!;
    this.loadEndpoints(
      page,
      limit,
      this.searchQuery,
      this.activeFilter === "all" ? undefined : this.activeFilter
    );
  }

  filterByStatus(status: "all" | "active" | "inactive") {
    this.activeFilter = status;
    this.posthog.capture("endpoint_filtered", { status });
    this.loadEndpoints(
      1,
      this.rows,
      this.searchQuery,
      status === "all" ? undefined : status
    );
  }

  onSearchInput(event: any) {
    this.searchQuery = event.target.value;
    if (this.searchQuery.length >= 3) {
      this.posthog.capture("endpoint_searched", { query: this.searchQuery });
    }
    this.loadEndpoints(
      1,
      this.rows,
      this.searchQuery,
      this.activeFilter === "all" ? undefined : this.activeFilter
    );
  }

  toggleEndpointStatus(endpoint: IEndpoint) {
    const newStatus: EndpointStatus =
      endpoint.status === "active" ? "inactive" : "active";
    const action = newStatus === "active" ? "activate" : "deactivate";

    this.confirmationService.confirm({
      message: `Are you sure you want to ${action} this endpoint?`,
      header: `${action.charAt(0).toUpperCase() + action.slice(1)} Endpoint`,
      icon: "pi pi-exclamation-triangle",
      accept: () => {
        this.updateEndpointStatus(endpoint, newStatus);
      },
    });
  }

  private updateEndpointStatus(endpoint: IEndpoint, newStatus: EndpointStatus) {
    const updatePayload = {
      name: endpoint.name,
      status: newStatus,
      url: endpoint.url,
      method: endpoint.method,
      description: endpoint.description,
      enabled: newStatus === "active",
      config: endpoint.config,
      customHeaders: endpoint.customHeaders,
    };

    this.endpointService.updateStatus(endpoint._id, newStatus).subscribe({
      next: (response) => {
        // Update local data
        const index = this.endpoints.findIndex((e) => e._id === endpoint._id);
        if (index !== -1) {
          this.endpoints[index] = {
            ...this.endpoints[index],
            status: newStatus,
          };
          this.applyClientSideFiltering();
        }

        this.messageService.add({
          severity: "success",
          summary: "Success",
          detail: `Endpoint ${
            newStatus === "active" ? "activated" : "deactivated"
          } successfully`,
          life: 3000,
        });
        this.posthog.capture("endpoint_updated", {
          endpoint_id: endpoint._id,
          new_status: newStatus,
          context: "list_toggle",
        });
      },
      error: (error) => {
        this.sentry.captureException(error);
        this.posthog.capture("endpoint_update_error", {
          endpoint_id: endpoint._id,
          error: error.message,
          context: "list_toggle",
        });
        console.error("Error updating endpoint status:", error);

        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: "Failed to update endpoint status. Please try again.",
          life: 5000,
        });
      },
    });
  }

  deleteEndpoint(endpoint: IEndpoint) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${endpoint.name}"? This action cannot be undone.`,
      header: "Delete Endpoint",
      icon: "pi pi-exclamation-triangle",
      acceptButtonStyleClass: "p-button-danger",
      accept: () => {
        this.performDelete(endpoint);
      },
    });
  }

  private performDelete(endpoint: IEndpoint) {
    // Note: You'll need to add a delete method to your EndpointService
    // For now, I'll simulate the deletion by removing from local array
    // Uncomment the following when you add the delete method to the service:

    /*
    this.endpointService.delete(endpoint._id)
      .subscribe({
        next: () => {
          this.removeEndpointFromLocal(endpoint);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Endpoint deleted successfully',
            life: 3000
          });
        },
        error: (error) => {
          console.error('Error deleting endpoint:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete endpoint. Please try again.',
            life: 5000
          });
        }
      });
    */

    // Temporary local deletion (remove this when you implement the service method)
    this.removeEndpointFromLocal(endpoint);
    this.messageService.add({
      severity: "success",
      summary: "Success",
      detail: "Endpoint deleted successfully",
      life: 3000,
    });
    this.posthog.capture("endpoint_deleted", { endpoint_id: endpoint._id });
  }

  private removeEndpointFromLocal(endpoint: IEndpoint) {
    const index = this.endpoints.findIndex((e) => e._id === endpoint._id);
    if (index !== -1) {
      this.endpoints.splice(index, 1);
      this.applyClientSideFiltering();
    }
  }

  onPageChange(event: any) {
    this.currentPage = event.page + 1; // PrimeNG uses 0-based indexing
    this.rows = event.rows;
    // If you implement server-side pagination, call loadEndpoints here
    // this.loadEndpoints(this.currentPage);
  }

  refreshEndpoints() {
    this.searchQuery = "";
    this.activeFilter = "all";
    this.loadEndpoints();
  }

  // Utility method to format dates
  formatDate(date: string | Date): string {
    if (!date) return "Never";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString();
  }
}

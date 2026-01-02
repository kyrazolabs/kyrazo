import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterModule } from "@angular/router";

import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { DividerModule } from "primeng/divider";
import { TooltipModule } from "primeng/tooltip";

import { EndpointService } from "@core/services/endpoint.service";
import { SentryService } from "@core/3rd-party/sentry";
import { Endpoint } from "@models/endpoint.types";

@Component({
  selector: "app-endpoint-detail",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TagModule,
    DividerModule,
    TooltipModule,
  ],
  templateUrl: "./detail.page.html",
  styleUrl: "./detail.page.scss",
  providers: [EndpointService],
})
export class EndpointDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private eps = inject(EndpointService);
  private sentry = inject(SentryService);

  endpoint = signal<Partial<Endpoint>>({});

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (id) {
      this.eps.get(id).subscribe({
        next: (response) => {
          const data: Partial<Endpoint> = {
            ...response.data,
            stats: {
              totalRequests: 1547,
              successfulRequests: 1489,
              failedRequests: 58,
              avgResponseTime: 245,
            },
          };
          this.endpoint.set(data);
        },
        error: (error) => {
          this.sentry.captureException(error);
          console.error(error);
        },
      });
    }
  }

  getSuccessRate(): number {
    const stats = this.endpoint()?.stats;
    if (!stats) return 0;

    const { totalRequests, successfulRequests } = stats;
    return totalRequests > 0
      ? Math.round((successfulRequests / totalRequests) * 100)
      : 0;
  }

  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" {
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "inactive":
        return "danger";
      case "pending":
        return "warn";
      default:
        return "info";
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  copyToClipboard(text: string): void {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log("Copied to clipboard:", text);
        // تقدر تحط toast هنا
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
      });
  }
}

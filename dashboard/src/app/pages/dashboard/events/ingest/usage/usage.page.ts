import { Component, OnInit, AfterViewInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { CardModule } from "primeng/card";
import { ChartModule } from "primeng/chart";
import { ButtonModule } from "primeng/button";
import { SelectModule } from "primeng/select";
import { TableModule } from "primeng/table";

import {
  AnalyticsService,
  IngestUsageResponse,
  TimeRange,
} from "@core/services/analytics.service";
import { SentryService } from "@core/3rd-party/sentry";
import { PostHogService } from "@core/3rd-party/posthog";

@Component({
  selector: "app-usage.page",
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ChartModule,
    ButtonModule,
    SelectModule,
    TableModule,
  ],
  templateUrl: "./usage.page.html",
  styleUrl: "./usage.page.scss",
})
export class UsagePage implements OnInit, AfterViewInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly sentry = inject(SentryService);
  private readonly posthog = inject(PostHogService);

  selectedTimeRange: TimeRange = "last7days";
  timeRangeOptions = [
    { label: "Last 7 days", value: "last7days" },
    { label: "Last 30 days", value: "last30days" },
    { label: "Last 90 days", value: "last90days" },
    { label: "Last 6 months", value: "last180days" },
    { label: "Last year", value: "last360days" },
  ];

  loadingCharts = true;
  overview: IngestUsageResponse["data"] | null = null;

  // Chart data
  eventsReceivedData: any;
  eventsReceivedOptions: any;

  statusDistributionData: any;
  statusDistributionOptions: any;

  failuresOverTimeData: any;
  failuresOverTimeOptions: any;

  topEndpointsData: any;
  topEndpointsOptions: any;

  processingLatencyData: any;
  processingLatencyOptions: any;

  sourcesData: any;
  sourcesOptions: any;

  sourceLogs: any[];

  async ngOnInit() {
    this.posthog.capture("usage_viewed", { type: "ingest" });
    await this.loadAnalytics();
  }

  ngAfterViewInit() {
    // Create gradients after view init for area charts
    this.createGradients();
  }

  private createGradients() {
    // Create gradient for Events Received chart
    const eventsCanvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (eventsCanvas) {
      const ctx = eventsCanvas.getContext("2d");
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, "rgba(59, 130, 246, 0.3)");
        gradient.addColorStop(1, "rgba(59, 130, 246, 0.05)");
        this.eventsReceivedData.datasets[0].backgroundColor = gradient;
      }
    }
  }

  async loadAnalytics() {
    return new Promise<void>((resolve) => {
      this.analyticsService.getIngestUsage(this.selectedTimeRange).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.overview = response.data;
            const days = this.getDaysFromRange(this.selectedTimeRange);
            this.overview.receiveTrends = this.fillMissingDays(
              this.overview.receiveTrends,
              days,
              "events"
            );
            this.overview.failureTrends = this.fillMissingDays(
              this.overview.failureTrends,
              days,
              "total"
            );
            if (
              this.selectedTimeRange === "last180days" ||
              this.selectedTimeRange === "last360days"
            ) {
              this.overview.receiveTrends = this.aggregateByMonth(
                this.overview.receiveTrends,
                "events"
              );
              this.overview.failureTrends = this.aggregateByMonth(
                this.overview.failureTrends,
                "total"
              );
            }
            this.initCharts();
          }
          resolve();
        },
        error: (err) => {
          this.sentry.captureException(err);
          console.error("Failed to load ingest analytics:", err);
          this.overview = null;
          this.loadingCharts = false;
          resolve();
        },
      });
    });
  }

  onTimeRangeChange() {
    this.loadingCharts = true;
    this.posthog.capture("usage_timerange_changed", {
      type: "ingest",
      range: this.selectedTimeRange,
    });
    this.loadAnalytics();
  }

  initCharts() {
    if (!this.overview) return;

    const isMonthly =
      this.selectedTimeRange === "last180days" ||
      this.selectedTimeRange === "last360days";
    const receiveTrends = this.overview.receiveTrends || [];

    // Events Received Over Time (Line Chart)
    const receivedData = receiveTrends.map((d) => d.events);
    const allReceivedData = [...receivedData];
    const maxReceivedValue =
      allReceivedData.length > 0 ? Math.max(...allReceivedData) : 0;

    this.eventsReceivedData = {
      labels: receiveTrends.map((d) => this.formatDateLabel(d.day, isMonthly)),
      datasets: [
        {
          label: "Events Received",
          data: receivedData,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: "#3b82f6",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
        },
      ],
    };

    this.eventsReceivedOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          callbacks: {
            label: (context: any) =>
              `Events: ${context.parsed.y.toLocaleString()}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: Math.ceil(maxReceivedValue * 1.01),
          grid: { display: false },
          border: { display: false },
          ticks: {
            callback: (value: any) => value.toLocaleString(),
            font: { size: 11 },
            padding: 10,
          },
        },
        x: {
          grid: {
            display: true,
            color: "rgba(0, 0, 0, 0.1)",
            borderDash: [5, 5],
            drawTicks: false,
          },
          border: { display: false },
          ticks: {
            font: { size: 11 },
            maxRotation: 45,
            minRotation: 45,
            padding: 10,
          },
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
      elements: {
        line: { tension: 0.5 },
        point: { radius: 0, hoverRadius: 6 },
      },
      hover: {
        mode: "index",
        intersect: false,
      },
    };

    // Status Distribution (Pie/Donut Chart)
    const statusDistribution = this.overview.processStatusDistribution || [];
    this.statusDistributionData = {
      labels: statusDistribution.map((s) => s.processing_status),
      datasets: [
        {
          data: statusDistribution.map((s) => s.total),
          backgroundColor: statusDistribution.map((s) =>
            this.getStatusColor(s.processing_status)
          ),
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    };

    this.statusDistributionOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const total = context.dataset.data.reduce(
                (a: number, b: number) => a + b,
                0
              );
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${
                context.label
              }: ${context.parsed.toLocaleString()} (${percentage}%)`;
            },
          },
        },
      },
    };

    // Failures Over Time (Area Chart)
    const failureTrends = this.overview.failureTrends || [];
    const failedData = failureTrends.map((d) => d.total);
    const allFailedData = [...failedData];
    const maxFailedValue =
      allFailedData.length > 0 ? Math.max(...allFailedData) : 0;

    this.failuresOverTimeData = {
      labels: failureTrends.map((d) => this.formatDateLabel(d.day, isMonthly)),
      datasets: [
        {
          label: "Failures",
          data: failedData,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.2)",
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: "#ef4444",
        },
      ],
    };

    this.failuresOverTimeOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          callbacks: {
            label: (context: any) => `Failures: ${context.parsed.y}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: Math.ceil(maxFailedValue * 1.01),
          grid: { display: false },
          border: { display: false },
          ticks: {
            font: { size: 11 },
            padding: 10,
          },
        },
        x: {
          grid: {
            display: true,
            color: "rgba(0, 0, 0, 0.1)",
            borderDash: [5, 5],
            drawTicks: false,
          },
          border: { display: false },
          ticks: {
            font: { size: 11 },
            maxRotation: 45,
            minRotation: 45,
            padding: 10,
          },
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
      elements: {
        line: { tension: 0.5 },
        point: { radius: 0, hoverRadius: 6 },
      },
      hover: {
        mode: "index",
        intersect: false,
      },
    };

    // Sources (Vertical Bar Chart)
    const topSources = this.overview.topSources || [];
    this.sourcesData = {
      labels: topSources.map((s) => s.source),
      datasets: [
        {
          label: "Events",
          data: topSources.map((s) => s.total),
          backgroundColor: "#1da1f2",
          borderRadius: 4,
          borderSkipped: false,
          barThickness: 32,
          maxBarThickness: 40,
          borderWidth: 0,
          hoverBackgroundColor: "#1991db",
        },
      ],
    };

    this.sourcesOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          cornerRadius: 8,
          padding: 10,
          displayColors: false,
          callbacks: {
            title: (context: any) =>
              context[0].label
                .replace("-", " ")
                .replace(/\b\w/g, (l: string) => l.toUpperCase()),
            label: (context: any) => {
              const value = context.parsed.y;
              if (value >= 1000) {
                return `${(value / 1000).toFixed(1)}K events`;
              }
              return `${value.toLocaleString()} events`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            color: "rgba(0, 0, 0, 0.06)",
            drawBorder: false,
            lineWidth: 1,
          },
          border: { display: false },
          ticks: {
            color: "#6b7280",
            font: { size: 11, weight: "400" },
            padding: 8,
            callback: (value: any) => {
              if (value >= 1000) {
                return (value / 1000).toFixed(0) + "k";
              }
              return value.toLocaleString();
            },
          },
        },
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: "#374151",
            font: { size: 11, weight: "400" },
            padding: 4,
            callback: (value: any, index: any) => {
              const label = topSources[index]?.source || value;
              return label
                .replace("-", " ")
                .replace(/\b\w/g, (l: string) => l.toUpperCase());
            },
          },
        },
      },
      elements: {
        bar: { borderRadius: 4 },
      },
      animation: {
        duration: 800,
        easing: "easeOutCubic",
      },
      barPercentage: 0.8,
      categoryPercentage: 0.9,
    };

    this.loadingCharts = false;
  }

  // Stats getters
  getIngests(): number {
    return this.overview?.stats?.ingests || 0;
  }

  getTotalEvents(): number {
    return this.overview?.stats?.total_events || 0;
  }

  getSuccessfulEvents(): number {
    return this.overview?.stats?.successful_events || 0;
  }

  getSuccessRate(): number {
    return this.overview?.stats?.success_rate || 0;
  }

  get SuccessRate(): number {
    return this.overview?.stats?.success_rate || 0;
  }

  get hasData(): boolean {
    return this.getTotalEvents() > 0;
  }

  // Helper methods
  getStatusColor(status: string): string {
    if (!status) return "#6b7280"; // Default gray for undefined/null

    switch (status.toLowerCase()) {
      case "processed":
      case "delivered":
        return "#10b981"; // Success green
      case "pending":
      case "processing":
        return "#f59e0b"; // Warning orange
      case "failed":
      case "timeout":
      case "network_error":
        return "#ef4444"; // Error red
      default:
        return "#6b7280"; // Default gray
    }
  }

  getDaysFromRange(range: string): number {
    switch (range) {
      case "last7days":
        return 7;
      case "last30days":
        return 30;
      case "last90days":
        return 90;
      case "last180days":
        return 180;
      case "last360days":
        return 360;
      default:
        return 7;
    }
  }

  fillMissingDays(
    trends: any[],
    days: number,
    valueField: string = "events"
  ): any[] {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days + 1);

    const dateMap = new Map<string, any>();
    trends.forEach((item) => {
      dateMap.set(item.day, item);
    });

    const filled: any[] = [];
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dayStr = d.toISOString().split("T")[0];
      if (dateMap.has(dayStr)) {
        filled.push(dateMap.get(dayStr));
      } else {
        filled.push({
          day: dayStr,
          [valueField]: 0,
        });
      }
    }
    return filled;
  }

  aggregateByMonth(trends: any[], valueField: string = "events"): any[] {
    const monthMap = new Map<string, { value: number; count: number }>();
    trends.forEach((item) => {
      const date = new Date(item.day);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { value: 0, count: 0 });
      }
      const monthData = monthMap.get(monthKey)!;
      monthData.value += item[valueField];
      monthData.count += 1;
    });

    const aggregated: any[] = [];
    monthMap.forEach((data, monthKey) => {
      aggregated.push({
        day: monthKey,
        [valueField]: data.value,
      });
    });
    return aggregated.sort((a, b) => a.day.localeCompare(b.day));
  }

  formatDateLabel(dateStr: string, isMonthly: boolean): string {
    if (isMonthly) {
      const [year, month] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
    } else {
      return dateStr;
    }
  }
}

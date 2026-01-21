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
  lineShadowPlugin = [
    {
      id: "lineShadow",
      beforeDatasetDraw(chart: any, args: any) {
        const { ctx } = chart;
        if (args.meta.type === "line") {
          const borderColor = args.meta.dataset.options.borderColor;
          ctx.save();
          ctx.shadowColor = borderColor || "rgba(0, 0, 0, 0.15)";
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 12;
        }
      },
      afterDatasetDraw(chart: any, args: any) {
        const { ctx } = chart;
        if (args.meta.type === "line") {
          ctx.restore();
        }
      },
    },
  ];
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
    // No longer needed: background fills replaced by shadows
  }

  private getPrimaryColor(shade: string = "500"): string {
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue(`--p-primary-${shade}`)
        .trim() || "#3b82f6"
    );
  }

  private isDarkMode(): boolean {
    return document.documentElement.classList.contains("p-dark");
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
              "events",
            );
            this.overview.failureTrends = this.fillMissingDays(
              this.overview.failureTrends,
              days,
              "total",
            );
            if (
              this.selectedTimeRange === "last180days" ||
              this.selectedTimeRange === "last360days"
            ) {
              this.overview.receiveTrends = this.aggregateByMonth(
                this.overview.receiveTrends,
                "events",
              );
              this.overview.failureTrends = this.aggregateByMonth(
                this.overview.failureTrends,
                "total",
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
    const receivedData = receiveTrends.map((d: any) => d.events);
    const allReceivedData = [...receivedData];
    const maxReceivedValue =
      allReceivedData.length > 0 ? Math.max(...allReceivedData) : 0;

    const isDark = this.isDarkMode();
    const primary500 = this.getPrimaryColor("500");
    const rose500 = "#f43f5e";
    const emerald500 = "#10b981";
    const slate500 = "#64748b";

    // Grid colors for light/dark
    const gridColor = isDark
      ? "rgba(255, 255, 255, 0.05)"
      : "rgba(15, 23, 42, 0.05)";

    this.eventsReceivedData = {
      labels: receiveTrends.map((d: any) =>
        this.formatDateLabel(d.day, isMonthly),
      ),
      datasets: [
        {
          label: "Events Received",
          data: receivedData,
          borderColor: primary500,
          backgroundColor: "transparent",
          tension: 0.4,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: primary500,
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          borderWidth: 3,
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
          max: Math.ceil(maxReceivedValue * 1.05),
          grid: {
            display: true,
            color: gridColor,
            borderDash: [5, 5],
            drawTicks: false,
          },
          border: { display: false },
          ticks: {
            color: slate500,
            callback: (value: any) => value.toLocaleString(),
            font: { size: 11, weight: "500" },
            padding: 10,
          },
        },
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: slate500,
            font: { size: 11, weight: "500" },
            maxRotation: 0,
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
            this.getStatusColor(s.processing_status),
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
                0,
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
    const failedData = failureTrends.map((d: any) => d.total);
    const allFailedData = [...failedData];
    const maxFailedValue =
      allFailedData.length > 0 ? Math.max(...allFailedData) : 0;

    this.failuresOverTimeData = {
      labels: failureTrends.map((d: any) =>
        this.formatDateLabel(d.day, isMonthly),
      ),
      datasets: [
        {
          label: "Failures",
          data: failedData,
          borderColor: rose500,
          backgroundColor: "transparent",
          tension: 0.4,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: rose500,
          borderWidth: 3,
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
          backgroundColor: primary500,
          borderRadius: 4,
          borderSkipped: false,
          barThickness: 32,
          maxBarThickness: 40,
          borderWidth: 0,
          hoverBackgroundColor: this.getPrimaryColor("600"),
        },
      ],
    };

    this.sourcesOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0f172a",
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          cornerRadius: 8,
          padding: 10,
          callbacks: {
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
    const isDark = this.isDarkMode();

    switch (status.toLowerCase()) {
      case "processed":
      case "delivered":
        return this.getPrimaryColor("500");
      case "pending":
      case "processing":
        return isDark
          ? this.getPrimaryColor("600")
          : this.getPrimaryColor("400");
      case "failed":
      case "timeout":
      case "network_error":
        return isDark
          ? this.getPrimaryColor("700")
          : this.getPrimaryColor("300");
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
    valueField: string = "events",
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
        date.getMonth() + 1,
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
      if (!dateStr.includes("-")) return dateStr;
      const [year, month] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1);
      return date.toLocaleDateString("en-US", {
        month: "long",
      });
    } else {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  }
}

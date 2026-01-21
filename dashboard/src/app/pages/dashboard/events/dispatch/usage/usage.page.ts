import { Component, OnInit, AfterViewInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { SelectModule } from "primeng/select";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { ChartModule } from "primeng/chart";
import { TableModule } from "primeng/table";

import {
  AnalyticsService,
  DispatchUsageResponse,
  TimeRange,
} from "@core/services/analytics.service";
import { SentryService } from "@core/3rd-party/sentry";
import { PostHogService } from "@core/3rd-party/posthog";

@Component({
  selector: "app-usage.page",
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    ButtonModule,
    CardModule,
    ChartModule,
    TableModule,
  ],
  templateUrl: "./usage.page.html",
  styleUrls: ["./usage.page.scss"],
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
  overview: DispatchUsageResponse["data"] | null = null;

  lineChartData: any;
  lineChartOptions: any;
  eventTypesChartData: any;
  eventTypesChartOptions: any;
  statusCodeChartData: any;
  statusCodeChartOptions: any;

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

  async ngOnInit() {
    this.posthog.capture("usage_viewed", { type: "dispatch" });
    await this.loadAnalytics();
  }

  ngAfterViewInit() {
    // No longer needed: background fills replaced by shadows
  }

  async loadAnalytics() {
    return new Promise<void>((resolve) => {
      this.analyticsService.getDispatchUsage(this.selectedTimeRange).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.overview = response.data;
            const days = this.getDaysFromRange(this.selectedTimeRange);
            this.overview.deliveryTrends = this.fillMissingDays(
              this.overview.deliveryTrends,
              days,
            );
            if (
              this.selectedTimeRange === "last180days" ||
              this.selectedTimeRange === "last360days"
            ) {
              this.overview.deliveryTrends = this.aggregateByMonth(
                this.overview.deliveryTrends,
              );
            }
            this.initCharts();
          }
          resolve();
        },
        error: (err) => {
          this.sentry.captureException(err);
          console.error("Failed to load analytics:", err);
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
      type: "dispatch",
      range: this.selectedTimeRange,
    });
    this.loadAnalytics();
  }

  initCharts() {
    if (!this.overview) return;

    const isMonthly =
      this.selectedTimeRange === "last180days" ||
      this.selectedTimeRange === "last360days";
    const deliveryTrends = this.overview.deliveryTrends || [];

    // Line Chart for Delivery Trends
    const successfulData = deliveryTrends.map((d) => d.successful);
    const failedData = deliveryTrends.map((d) => d.failed);
    const allData = [...successfulData, ...failedData];
    const maxLineValue = allData.length > 0 ? Math.max(...allData) : 0;

    const isDark = this.isDarkMode();
    const primary500 = this.getPrimaryColor("500");
    const rose500 = "#f43f5e";
    const emerald500 = "#10b981";
    const slate500 = "#64748b";

    // Grid colors for light/dark
    const gridColor = isDark
      ? "rgba(255, 255, 255, 0.05)"
      : "rgba(15, 23, 42, 0.05)";

    this.lineChartData = {
      labels: deliveryTrends.map((d) => this.formatDateLabel(d.day, isMonthly)),
      datasets: [
        {
          label: "Successful Deliveries",
          data: successfulData,
          borderColor: primary500,
          backgroundColor: "transparent",
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: primary500,
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          fill: false,
          borderWidth: 3,
        },
        {
          label: "Failed Deliveries",
          data: failedData,
          borderColor: rose500,
          backgroundColor: "transparent",
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: rose500,
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          fill: false,
          borderWidth: 3,
        },
      ],
    };

    this.lineChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 12 },
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleFont: { size: 12 },
          bodyFont: { size: 12 },
          padding: 10,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: Math.ceil(maxLineValue * 1.05),
          grid: {
            display: true,
            color: gridColor,
            borderDash: [5, 5],
            drawTicks: false,
          },
          border: { display: false },
          ticks: {
            color: slate500,
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

    // Top Event Types Bar Chart
    this.eventTypesChartData = {
      labels: this.overview.topEventTypes.map((m) => m.event_type),
      datasets: [
        {
          label: "Event Count",
          data: this.overview.topEventTypes.map((m) => m.total),
          backgroundColor: primary500,
          borderRadius: 4,
          borderSkipped: false,
          barThickness: 32,
          maxBarThickness: 40,
        },
      ],
    };
    this.eventTypesChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          cornerRadius: 8,
          padding: 12,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
            drawBorder: false,
          },
          ticks: {
            color: "#6b7280",
            font: { size: 12 },
          },
        },
        x: {
          grid: { display: false },
          ticks: {
            color: "#6b7280",
            font: { size: 11 },
            maxRotation: 45,
          },
        },
      },
    };

    // Status Code Distribution Pie Chart
    const statusCodes = this.overview.statusCodeDistribution || [];
    this.statusCodeChartData = {
      labels: statusCodes.map((sc) => `${sc.response_code}`),
      datasets: [
        {
          data: statusCodes.map((sc) => sc.total),
          backgroundColor: statusCodes.map((sc) =>
            this.getStatusCodeColor(sc.response_code),
          ),
          borderWidth: 0,
          hoverOffset: 4,
          borderRadius: 8,
          spacing: 5,
        },
      ],
    };
    this.statusCodeChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 12 },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              const total = context.dataset.data.reduce(
                (a: number, b: number) => a + b,
                0,
              );
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            },
          },
        },
      },
    };

    this.loadingCharts = false;
  }

  // Stats getters
  getTotalTargets(): number {
    return this.overview?.stats?.total_targets || 0;
  }

  getTotalDeliveries(): number {
    return this.overview?.stats?.total_deliveries || 0;
  }

  getSuccessfulDeliveries(): number {
    return this.overview?.stats?.successful_deliveries || 0;
  }

  getFailedDeliveries(): number {
    return this.overview?.stats?.failed_deliveries || 0;
  }

  getSuccessRate(): number {
    return this.overview?.stats?.success_rate || 0;
  }

  getAverageDeliveryTime(): number | null {
    return this.overview?.stats?.average_delivery_time || null;
  }

  get AverageDeliveryTime(): number | null {
    return this.overview?.stats?.average_delivery_time || null;
  }

  get hasData(): boolean {
    return this.getTotalDeliveries() > 0;
  }

  // Helper methods
  getStatusCodeColor(statusCode: number): string {
    const isDark = this.isDarkMode();
    if (statusCode >= 200 && statusCode < 300) {
      return this.getPrimaryColor("500");
    } else if (statusCode >= 300 && statusCode < 400) {
      return isDark ? this.getPrimaryColor("600") : this.getPrimaryColor("400");
    } else if (statusCode >= 400 && statusCode < 500) {
      return isDark ? this.getPrimaryColor("700") : this.getPrimaryColor("300");
    } else if (statusCode >= 500) {
      return isDark ? this.getPrimaryColor("800") : this.getPrimaryColor("200");
    }
    return "#6b7280"; // Default gray
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

  fillMissingDays(deliveryTrends: any[], days: number): any[] {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days + 1); // Include today

    const dateMap = new Map<string, any>();
    deliveryTrends.forEach((item) => {
      dateMap.set(item.day, item);
    });

    const filled: any[] = [];
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dayStr = d.toISOString().split("T")[0];
      if (dateMap.has(dayStr)) {
        filled.push(dateMap.get(dayStr));
      } else {
        filled.push({
          workspace_id: deliveryTrends[0]?.workspace_id || "",
          project_id: deliveryTrends[0]?.project_id || "",
          day: dayStr,
          target: deliveryTrends[0]?.target || "",
          successful: 0,
          failed: 0,
        });
      }
    }
    return filled;
  }

  aggregateByMonth(deliveryTrends: any[]): any[] {
    const monthMap = new Map<
      string,
      { successful: number; failed: number; count: number }
    >();
    deliveryTrends.forEach((item) => {
      const date = new Date(item.day);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}`;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { successful: 0, failed: 0, count: 0 });
      }
      const monthData = monthMap.get(monthKey)!;
      monthData.successful += item.successful;
      monthData.failed += item.failed;
      monthData.count += 1;
    });

    const aggregated: any[] = [];
    monthMap.forEach((data, monthKey) => {
      aggregated.push({
        workspace_id: deliveryTrends[0]?.workspace_id || "",
        project_id: deliveryTrends[0]?.project_id || "",
        day: monthKey,
        target: deliveryTrends[0]?.target || "",
        successful: data.successful,
        failed: data.failed,
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

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
  overview: DispatchUsageResponse["data"] | null = null;

  lineChartData: any;
  lineChartOptions: any;
  eventTypesChartData: any;
  eventTypesChartOptions: any;
  statusCodeChartData: any;
  statusCodeChartOptions: any;

  async ngOnInit() {
    this.posthog.capture("usage_viewed", { type: "dispatch" });
    await this.loadAnalytics();
  }

  ngAfterViewInit() {
    // Create gradient after view init
    const lineCanvas = document.getElementById(
      "lineChart"
    ) as HTMLCanvasElement;
    if (lineCanvas) {
      const ctx = lineCanvas.getContext("2d")!;
      const gradientGreen = ctx.createLinearGradient(0, 0, 0, 150);
      gradientGreen.addColorStop(0, "rgba(16, 185, 129, 0.3)");
      gradientGreen.addColorStop(1, "rgba(16, 185, 129, 0)");

      const gradientRed = ctx.createLinearGradient(0, 0, 0, 150);
      gradientRed.addColorStop(0, "rgba(239, 68, 68, 0.3)");
      gradientRed.addColorStop(1, "rgba(239, 68, 68, 0)");

      // Apply gradients
      this.lineChartData.datasets[0].backgroundColor = gradientGreen;
      this.lineChartData.datasets[1].backgroundColor = gradientRed;
    }
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
              days
            );
            if (
              this.selectedTimeRange === "last180days" ||
              this.selectedTimeRange === "last360days"
            ) {
              this.overview.deliveryTrends = this.aggregateByMonth(
                this.overview.deliveryTrends
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

    this.lineChartData = {
      labels: deliveryTrends.map((d) => this.formatDateLabel(d.day, isMonthly)),
      datasets: [
        {
          label: "Successful Deliveries",
          data: successfulData,
          borderColor: "#10b981",
          backgroundColor: "transparent",
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: "#10b981",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          fill: false,
          borderWidth: 3,
          shadowColor: "rgba(16, 185, 129, 0.3)",
          shadowBlur: 8,
          shadowOffsetX: 0,
          shadowOffsetY: 4,
        },
        {
          label: "Failed Deliveries",
          data: failedData,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.3)",
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: "#ef4444",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          fill: false,
          borderWidth: 3,
          shadowColor: "rgba(239, 68, 68, 0.3)",
          shadowBlur: 8,
          shadowOffsetX: 0,
          shadowOffsetY: 4,
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
          max: Math.ceil(maxLineValue * 1.01),
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

    // Top Event Types Bar Chart
    this.eventTypesChartData = {
      labels: this.overview.topEventTypes.map((m) => m.event_type),
      datasets: [
        {
          label: "Event Count",
          data: this.overview.topEventTypes.map((m) => m.total),
          backgroundColor: "#3b82f6",
          borderRadius: 12,
          borderSkipped: false,
          barThickness: 40,
          barPercentage: 0.8,
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
            this.getStatusCodeColor(sc.response_code)
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
                0
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
    if (statusCode >= 200 && statusCode < 300) {
      return "#10b981"; // Success green
    } else if (statusCode >= 300 && statusCode < 400) {
      return "#3b82f6"; // Info blue
    } else if (statusCode >= 400 && statusCode < 500) {
      return "#f59e0b"; // Warning orange
    } else if (statusCode >= 500) {
      return "#ef4444"; // Error red
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
        date.getMonth() + 1
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

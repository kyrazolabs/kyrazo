import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "environments/environment";

export interface DispatchUsageStats {
  total_targets: number;
  active_targets?: number;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  pending_deliveries: number;
  average_delivery_time: number | null;
  success_rate: number;
}

export interface DeliveryTrend {
  day: string;
  target: string;
  successful: number;
  failed: number;
}

export interface TopEventType {
  target: string;
  event_type: string;
  total: number;
}

export interface StatusCodeDistribution {
  target: string;
  response_code: number;
  total: number;
}

export interface IngestUsageStats {
  ingests: number;
  total_events: number;
  successful_events: number;
  failed_events: number;
  pending_events: number;
  success_rate: number;
}

export interface ReceiveTrend {
  day: string;
  events: number;
}

export interface TopSource {
  source: string;
  total: number;
}

export interface ProcessStatusDistribution {
  processing_status: string;
  total: number;
}

export interface FailureTrend {
  day: string;
  total: number;
}

export interface DispatchUsageResponse {
  success: boolean;
  data: {
    stats: DispatchUsageStats;
    deliveryTrends: DeliveryTrend[];
    topEventTypes: TopEventType[];
    statusCodeDistribution: StatusCodeDistribution[];
  };
}

export interface IngestUsageResponse {
  success: boolean;
  data: {
    stats: IngestUsageStats;
    receiveTrends: ReceiveTrend[];
    topSources: TopSource[];
    processStatusDistribution: ProcessStatusDistribution[];
    failureTrends: FailureTrend[];
  };
}

export type TimeRange =
  | "last7days"
  | "last30days"
  | "last90days"
  | "last180days"
  | "last360days";

@Injectable({
  providedIn: "root",
})
export class AnalyticsService {
  private http = inject(HttpClient);

  getDispatchUsage(timeRange: TimeRange): Observable<DispatchUsageResponse> {
    const params = new HttpParams().set("days", timeRange);
    return this.http.get<DispatchUsageResponse>(
      environment.analytics.dispatchUsage,
      { params }
    );
  }

  getIngestUsage(timeRange: TimeRange): Observable<IngestUsageResponse> {
    const params = new HttpParams().set("days", timeRange);
    return this.http.get<IngestUsageResponse>(
      environment.analytics.ingestUsage,
      { params }
    );
  }
}

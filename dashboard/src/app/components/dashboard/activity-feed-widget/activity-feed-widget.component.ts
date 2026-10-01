import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DeliveryService } from "@core/services/delivery.service";
import { ButtonModule } from "primeng/button";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-activity-feed-widget",
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterLink],
  templateUrl: "./activity-feed-widget.component.html",
})
export class ActivityFeedWidgetComponent implements OnInit {
  private deliveryService = inject(DeliveryService);

  activities: any[] = [];

  ngOnInit() {
    this.fetchActivities();
  }

  fetchActivities() {
    // Fetch recent deliveries
    this.deliveryService.gets({ limit: 10 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.activities = response.data.map((d: any) => ({
            id: d.id,
            event_type: d.event_type || "Unknown Event",
            target_name: "Webhook Endpoint", // API response might vary, assume general
            status: d.status,
            created_at: d.created_at,
          }));
        }
      },
      error: (err) => console.error("Failed to load activity", err),
    });
  }
}

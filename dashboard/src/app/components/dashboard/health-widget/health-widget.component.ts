import { Component, Input, OnChanges } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-health-widget",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./health-widget.component.html",
})
export class HealthWidgetComponent {
  @Input() successRate: number = 100;
  @Input() queueDepth: number = 0;

  get isHealthy(): boolean {
    return this.successRate >= 95;
  }
}

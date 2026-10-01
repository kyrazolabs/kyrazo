import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

export interface FlowStats {
  ingests: number;
  total_events: number;
  total_deliveries: number;
  active_targets: number;
}

@Component({
  selector: "app-event-flow-widget",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./event-flow-widget.component.html",
})
export class EventFlowWidgetComponent {
  @Input() stats: FlowStats = {
    ingests: 0,
    total_events: 0,
    total_deliveries: 0,
    active_targets: 0,
  };
}

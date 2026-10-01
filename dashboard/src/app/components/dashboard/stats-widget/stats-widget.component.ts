import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { ButtonModule } from "primeng/button";

export interface StatItem {
  title: string;
  icon: string;
  value: string | number;
  subtitle: string;
}

@Component({
  selector: "app-stats-widget",
  imports: [CommonModule, ButtonModule],
  templateUrl: "./stats-widget.component.html",
  styleUrl: "./stats-widget.component.scss",
})
export class StatsWidgetComponent {
  @Input() stats: StatItem[] = [];
}

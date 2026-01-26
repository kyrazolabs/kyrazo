import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TimelineModule } from "primeng/timeline";
import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";

interface ChangelogEvent {
  status?: string;
  week: string;
  date: string;
  icon?: string;
  color?: string;
  image?: string;
  title: string;
  description: string;
  type: "feat" | "perf" | "style" | "fix" | "chore" | "refactor" | "docs";
  changes: string[];
}

@Component({
  selector: "app-changelogs",
  standalone: true,
  imports: [
    CommonModule,
    TimelineModule,
    CardModule,
    TagModule,
    ButtonModule,
    TooltipModule,
  ],
  templateUrl: "./changelogs.page.html",
  styleUrl: "./changelogs.page.scss",
})
export class ChangelogsPage {
  events: ChangelogEvent[];

  constructor() {
    this.events = [
      {
        week: "Week 4",
        date: "Jan 22 - Jan 28, 2026",
        title: "Enhanced Dashboard & Analytics",
        description:
          "Major update to the dashboard visualization and analytics engine.",
        type: "feat",
        status: "Latest",
        changes: [
          "New interactive charts for delivery trends",
          "Added real-time event monitoring",
          "Improved mobile responsiveness for stats cards",
          "Fixed sorting issue in delivery logs",
        ],
      },
      {
        week: "Week 3",
        date: "Jan 15 - Jan 21, 2026",
        title: "Security & Stability",
        description: "Important security patches and authentication updates.",
        type: "fix",
        status: "Released",
        changes: [
          "Patched vulnerability in webhook signature verification",
          "Updated authentication middleware",
          "Optimized session handling",
        ],
      },
      {
        week: "Week 1",
        date: "Jan 01 - Jan 07, 2026",
        title: "New Integration Center",
        description:
          "Launched a new hub for managing third-party integrations.",
        type: "feat",
        status: "released",
        changes: [
          "Added support for Slack and Discord webhooks",
          "New API key management interface",
          "Refactored integration service for better performance",
        ],
      },
      {
        week: "Week 52",
        date: "Dec 25 - Dec 31, 2025",
        title: "Performance Optimization",
        description: "End-of-year performance tuning and bug fixes.",
        type: "perf",
        status: "Released",
        changes: [
          "Reduced initial load time by 40%",
          "Optimized database queries for large datasets",
          "Fixed memory leak in worker processes",
        ],
      },
      {
        week: "Week 50",
        date: "Dec 11 - Dec 17, 2025",
        title: "UI Design Refresh",
        description:
          "Complete overhaul of the user interface with new design system.",
        type: "style",
        status: "Released",
        changes: [
          "Implemented new dark mode theme",
          "Updated card components and typography",
          "Standardized spacing and layout across all pages",
        ],
      },
    ];
  }

  getTypeSeverity(
    type: string,
  ):
    | "success"
    | "info"
    | "warn"
    | "danger"
    | "secondary"
    | "contrast"
    | undefined {
    switch (type) {
      case "feat":
        return "success";
      case "fix":
        return "danger";
      case "perf":
        return "warn";
      case "style":
        return "info";
      case "refactor":
      case "chore":
        return "secondary";
      default:
        return "contrast";
    }
  }
}

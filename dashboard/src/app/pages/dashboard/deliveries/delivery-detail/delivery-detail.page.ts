import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterModule } from "@angular/router";

import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { DividerModule } from "primeng/divider";
import { ScrollPanelModule } from "primeng/scrollpanel";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";

import { LoaderService } from "@core/services/loader.service";
import { DeliveryService } from "@core/services/delivery.service";
import { IDeliveryAttempt } from "@models/delivery.types";

@Component({
  selector: "app-delivery-detail",
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TagModule,
    DividerModule,
    ScrollPanelModule,
    InputTextModule,
    TextareaModule,
  ],
  templateUrl: "./delivery-detail.page.html",
  styleUrl: "./delivery-detail.page.scss",
})
export class DeliveryDetailPage {
  private readonly das = inject(DeliveryService);
  loader = inject(LoaderService);

  delivery: IDeliveryAttempt;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const data = this.route.snapshot.data["delivery"];
    this.delivery = {
      ...data,
      request_header:
        typeof data.request_header === "string"
          ? JSON.parse(data.request_header)
          : data.request_header,
      request_body:
        typeof data.request_body === "string"
          ? JSON.parse(data.request_body)
          : data.request_body,
      response_header:
        typeof data.response_header === "string"
          ? JSON.parse(data.response_header)
          : data.response_header,
      response_body:
        typeof data.response_body === "string"
          ? JSON.parse(data.response_body)
          : data.response_body,
    };
  }

  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" {
    switch (status.toLowerCase()) {
      case "delivered":
        return "success";
      case "pending":
        return "info";
      case "failed":
        return "danger";
      case "retry":
        return "warn";
      default:
        return "info";
    }
  }

  getResponseCodeSeverity(
    responseCode?: number | null,
  ): "success" | "info" | "warn" | "danger" {
    if (responseCode === undefined || responseCode === null) return "info";

    if (responseCode >= 200 && responseCode < 300) {
      return "success";
    } else if (responseCode >= 300 && responseCode < 400) {
      return "info";
    } else if (responseCode >= 400 && responseCode < 500) {
      return "warn";
    } else if (responseCode >= 500) {
      return "danger";
    }

    return "info";
  }
}

import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterModule } from "@angular/router";

import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { DividerModule } from "primeng/divider";
import { ScrollPanelModule } from "primeng/scrollpanel";
import { InputTextModule } from "primeng/inputtext";

import { LoaderService } from "@core/services/loader.service";
import { DeliveryService } from "@core/services/delivery.service";
import { IDeliveryAttempt } from "@models/delivery.types";
import { NgxJsonViewerModule } from 'ngx-json-viewer';

@Component({
  selector: 'app-log.page',
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TagModule,
    DividerModule,
    ScrollPanelModule,
    InputTextModule,
    NgxJsonViewerModule
  ],
  templateUrl: './log.page.html',
  styleUrl: './log.page.scss',
})
export class LogPage {
  private readonly das = inject(DeliveryService);
  loader = inject(LoaderService);

  delivery: IDeliveryAttempt;
  rawView = false;
  payload = {
    field_0: "some string",
    field_1: "some string",
    nested: {
      key: "value",
      list: [1, 2, 3],
      deeper: {
        okay: true,
      },
    },
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const data = this.route.snapshot.data["data"];
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
    responseCode?: number,
  ): "success" | "info" | "warn" | "danger" {
    if (!responseCode) return "info";

    if (responseCode >= 200 && responseCode < 300) {
      return "success";
    } else if (responseCode >= 300 && responseCode < 4700) {
      return "info";
    } else if (responseCode >= 400 && responseCode < 500) {
      return "warn";
    } else if (responseCode >= 500) {
      return "danger";
    }

    return "info";
  }

  toggleRawView() {
    this.rawView = !this.rawView;
  }

  async copy(data: any) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      // Optionally show a message, but for now just copy
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }
}

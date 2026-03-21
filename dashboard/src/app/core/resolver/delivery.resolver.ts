// delivery.resolver.ts
import { ResolveFn } from "@angular/router";
import { inject } from "@angular/core";
import { DeliveryService, IngestEvent } from "@core/services/delivery.service";
import {
  GetDAResponse,
  GetDAWResponse,
  IDeliveryAttempt,
} from "@models/delivery.types";
import { map } from "rxjs/operators";
import { ApiResponse } from "@models/index";

export const deliveryResolver: ResolveFn<IDeliveryAttempt> = (route) => {
  const das = inject(DeliveryService);
  const id = route.paramMap.get("id")!;
  return das.get(id).pipe(map((res) => res.data));
};

export const deliveriesResolver: ResolveFn<ApiResponse<GetDAResponse[]>> = (
  route
) => {
  const das = inject(DeliveryService);
  return das.gets().pipe(map((res) => res));
};

export const eventResolver: ResolveFn<IngestEvent> = (route) => {
  const das = inject(DeliveryService);
  const eventId = route.paramMap.get("eventId")!;
  return das.getIngestEventById(eventId).pipe(map((res) => res.data));
};
export const ingestLogsResolver: ResolveFn<ApiResponse<IngestEvent[]>> = (
  route
) => {
  const das = inject(DeliveryService);
  return das.getIngestEvents();
};

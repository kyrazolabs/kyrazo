import { ResolveFn } from "@angular/router";
import { inject } from "@angular/core";
import { SourceService } from "@core/services/source.service"; // Renamed service
import { ISource } from "@models/source.types"; // Renamed model
import { map } from "rxjs/operators";
import { DeliveryService } from "@core/services/delivery.service";
import { GetDAWResponse } from "@models/delivery.types";

export const sourcesResolver: ResolveFn<ISource[]> = (route, state) => {
  const sourceService = inject(SourceService);
  return sourceService.gets().pipe(map((response) => response.data ?? []));
};

export const ingestsResolver: ResolveFn<ISource[]> = (route, state) => {
  const sourceService = inject(SourceService);
  return sourceService.gets().pipe(map((response) => response.data ?? []));
};

export const sourceResolver: ResolveFn<ISource> = (route) => {
  const sourceService = inject(SourceService);
  const id = route.paramMap.get("id")!;
  return sourceService.get(id).pipe(map((res) => res.data));
};

export const SourceDeliveriesResolver: ResolveFn<GetDAWResponse[]> = (
  route
) => {
  const deliveryService = inject(DeliveryService);
  const id = route.paramMap.get("id")!;
  return deliveryService.getBySource(id).pipe(map((res) => res.data));
};

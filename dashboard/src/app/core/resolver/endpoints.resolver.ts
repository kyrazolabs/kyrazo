import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { EndpointService } from '@core/services/endpoint.service';
import { IEndpoint } from '@models/endpoint.types';
import { map } from 'rxjs/operators';

export const endpointsResolver: ResolveFn<IEndpoint<string>[]> = (route, state) => {
  const eps = inject(EndpointService);

  return eps.gets().pipe(
    map((response) => response.data ?? []) // <-- إرجاع المصفوفة مباشرة
  );
};

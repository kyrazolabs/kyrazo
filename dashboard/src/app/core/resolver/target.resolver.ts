import { ResolveFn } from "@angular/router";
import { inject } from "@angular/core";
import { TargetService, ITarget } from "@core/services/target.service";
import { map } from "rxjs/operators";

export const targetResolver: ResolveFn<ITarget> = (route) => {
  const targetService = inject(TargetService);
  const id = route.paramMap.get("id")!;

  return targetService.getOne(id).pipe(map((res) => res.data));
};

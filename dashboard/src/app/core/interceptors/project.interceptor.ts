import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { StorageService } from "@core/services/storage.service";

export const projectInterceptor: HttpInterceptorFn = (req, next) => {
  const ss = inject(StorageService);
  const workspace = ss.getItem<string>("workspace");
  const project = ss.getItem<string>("project");

  if (
    req.url.includes("/v1/sources") ||
    req.url.includes("/v1/endpoints") ||
    req.url.includes("/v1/deliveries") ||
    req.url.includes("/v1/keys") ||
    req.url.includes("/v1/analytics") ||
    req.url.includes("/v1/targets") ||
    req.url.includes("/v1/plans") ||
    req.url.includes("/v1/subscriptions") ||
    req.url.includes("/v1/payment") ||
    req.url.includes("/v1/support")
  ) {
    const modified = req.clone({
      setHeaders: {
        "x-workspace-id": workspace ?? "",
        "x-project-id": project ?? "",
      },
    });
    return next(modified);
  }

  return next(req);
};

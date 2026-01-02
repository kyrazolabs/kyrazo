import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { StorageService } from "@core/services/storage.service";

export const workspaceInterceptor: HttpInterceptorFn = (req, next) => {
  const ss = inject(StorageService);
  const workspace = ss.getItem<string>("workspace");

  // Add workspace header for project workspace endpoints
  if (req.url.includes("/v1/projects") || req.url.includes("/v1/plans")) {
    const modified = req.clone({
      setHeaders: {
        "x-workspace-id": workspace ?? "",
      },
    });
    return next(modified);
  }
  return next(req);
};

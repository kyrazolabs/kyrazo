import { ResolveFn } from "@angular/router";
import { inject } from "@angular/core";
import { map } from "rxjs/operators";

import { IUserPreference, UserProfileResponse } from "@models/auth.types";
import { ISubscription, IPlan } from "@models/billing.types";
import { SettingService } from "@core/services/settings.service";

export const profileResolver: ResolveFn<UserProfileResponse> = (route) => {
  const sts = inject(SettingService);
  return sts.get().pipe(map((res) => res.data));
};

export const preferencesResolver: ResolveFn<IUserPreference> = (route) => {
  const sts = inject(SettingService);
  return sts.getPreferences().pipe(map((res) => res.data));
};

export const subscriptionResolver: ResolveFn<ISubscription | null> = (
  route
) => {
  const sts = inject(SettingService);
  return sts.getWorkspaceSubscriptions().pipe(
    map((res) => {
      if (res.success && res.data) {
        return (
          res.data.find((sub) =>
            ["active", "trialing", "past_due"].includes(sub.status)
          ) || null
        );
      }
      return null;
    })
  );
};

export const plansResolver: ResolveFn<IPlan[]> = (route) => {
  const sts = inject(SettingService);
  return sts.getPlans().pipe(map((res) => res.data));
};

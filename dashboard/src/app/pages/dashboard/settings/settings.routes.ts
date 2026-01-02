import { Routes } from "@angular/router";
import {
  preferencesResolver,
  profileResolver,
  subscriptionResolver,
  plansResolver,
} from "@core/resolver/settings.resolver";
import { WorkspaceSettingsResolver } from "./workspace-settings/workspace-settings.resolver";

export const settingsRoutes: Routes = [
  {
    path: "",
    redirectTo: "profile",
    pathMatch: "full",
  },
  {
    path: "profile",
    loadComponent: () =>
      import("./profile-settings/profile-settings.page").then(
        (p) => p.ProfileSettingsPage
      ),
    resolve: { profile: profileResolver },
    data: { title: "Profile Settings", animation: "profile-settings" },
  },
  {
    path: "notifications",
    loadComponent: () =>
      import("./notification-settings/notification-settings.page").then(
        (p) => p.NotificationSettingsPage
      ),
    resolve: { notiPreferences: preferencesResolver },
    data: {
      title: "Notifications Settings",
      animation: "notification-settings",
    },
  },
  // {
  //   path: 'billing',
  //   loadComponent: () => import('./billing-settings/billing-settings.page').then(p => p.BillingSettingsPage),
  //   resolve: {
  //     subscription: subscriptionResolver,
  //     plans: plansResolver
  //   },
  //   data: { title: "Billing", animation: 'billing-settings' }
  // },
  {
    path: "workspace",
    loadComponent: () =>
      import("./workspace-settings/workspace-settings.page").then(
        (p) => p.WorkspaceSettingsPage
      ),
    resolve: { workspace: WorkspaceSettingsResolver },
    data: { title: "Workspace Settings", animation: "workspace-settings" },
  },
];

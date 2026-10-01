import { Routes } from "@angular/router";

export const secretsRoutes: Routes = [
  {
    path: "",
    loadComponent: () => import("./secrets.page").then((c) => c.SecretsPage),
    data: { title: "Secrets Keys", animation: "secret-list" },
  },
];

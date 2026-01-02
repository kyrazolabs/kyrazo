import { Component, inject } from "@angular/core";
import {
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
  RouterOutlet,
} from "@angular/router";
import { CommonModule } from "@angular/common";

import { ButtonModule } from "primeng/button";
import { ToastModule } from "primeng/toast";
import { LoaderService } from "@core/services/loader.service";
import { PostHogService } from "@core/3rd-party/posthog";

import { routeTransitionAnimations } from "@shared/animations/route.animation";
import { AppConfig } from "@components/app.config";
@Component({
  selector: "app-root",
  imports: [RouterOutlet, CommonModule, ButtonModule, ToastModule, AppConfig],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
  animations: [routeTransitionAnimations],
})
export class AppComponent {
  public loader = inject(LoaderService);
  private posthog = inject(PostHogService);

  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.loader.show();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loader.hide();
        if (event instanceof NavigationEnd) {
          this.posthog.trackPageView();
        }
      }
    });
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.["animation"];
  }
}

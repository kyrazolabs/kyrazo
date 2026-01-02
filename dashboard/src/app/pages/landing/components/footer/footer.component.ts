import { Component, computed, inject } from "@angular/core";
import { LayoutService } from "@components/service/layout.service";

import { ScrollRevealDirective } from "@shared/directives/scroll-reveal.directive";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-landing-footer",
  imports: [ScrollRevealDirective, RouterLink],
  templateUrl: "./footer.component.html",
  styleUrl: "./footer.component.scss",
})
export class FooterComponent {
  layoutService: LayoutService = inject(LayoutService);
  isDarkMode = computed(() => this.layoutService.appState().darkMode);
}

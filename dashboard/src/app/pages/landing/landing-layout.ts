import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterOutlet, NavigationEnd } from "@angular/router";
import { HeaderComponent } from "./components/header/header.component";
import { FooterComponent } from "./components/footer/footer.component";
import { filter } from "rxjs/operators";

@Component({
  selector: "app-landing-layout",
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <main
      class="bg-surface-0 dark:bg-surface-950 min-h-screen min-w-screen relative overflow-x-hidden"
    >
      <app-landing-header></app-landing-header>

      <!-- Shared Background Blobs -->
      <div
        class="absolute -top-24 -left-48 w-[400px] h-[400px] bg-primary-500/30 dark:bg-primary-500/10 blur-3xl rounded-full pointer-events-none"
      ></div>
      <div
        class="absolute bottom-0 -right-48 w-[600px] h-[600px] bg-primary-400/20 dark:bg-primary-400/5 blur-[100px] rounded-full pointer-events-none"
      ></div>

      <router-outlet></router-outlet>

      <app-landing-footer></app-landing-footer>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class LandingLayoutComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
  }
}

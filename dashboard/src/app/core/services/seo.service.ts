import { Injectable } from "@angular/core";
import { Title, Meta } from "@angular/platform-browser";
import { Router, NavigationEnd, ActivatedRoute } from "@angular/router";
import { filter, map, mergeMap } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class SeoService {
  constructor(
    private titleService: Title,
    private metaService: Meta,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  init() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map((route) => {
          while (route.firstChild) route = route.firstChild;
          return route;
        }),
        mergeMap((route) => route.data),
      )
      .subscribe((data) => {
        this.updateTitle(data["title"]);
        this.updateMetaTags(data["meta"]);
      });
  }

  updateTitle(title: string) {
    const appName = "Kyrazo";
    if (title) {
      this.titleService.setTitle(`${title} | ${appName}`);
    } else {
      this.titleService.setTitle(appName);
    }
  }

  updateMetaTags(meta: any) {
    if (!meta) return;

    if (meta.description) {
      this.metaService.updateTag({
        name: "description",
        content: meta.description,
      });
      this.metaService.updateTag({
        property: "og:description",
        content: meta.description,
      });
      this.metaService.updateTag({
        name: "twitter:description",
        content: meta.description,
      });
    }

    if (meta.keywords) {
      this.metaService.updateTag({ name: "keywords", content: meta.keywords });
    }

    // Add default OG tags if missing
    this.metaService.updateTag({ property: "og:type", content: "website" });
  }
}

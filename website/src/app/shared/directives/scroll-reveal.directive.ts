import {
  Directive,
  ElementRef,
  Input,
  AfterViewInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  Renderer2,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";

@Directive({
  selector: "[appScrollReveal]",
  standalone: true,
})
export class ScrollRevealDirective implements AfterViewInit, OnDestroy {
  @Input() animationClass = "animate-fade-in-up";
  @Input() threshold = 0.1;
  @Input() delay = "";

  private observer: IntersectionObserver | null = null;
  private isBrowser: boolean;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit() {
    if (!this.isBrowser) return;

    // Initially hide the element to prevent flash
    this.renderer.addClass(this.el.nativeElement, "opacity-0");

    if (this.delay) {
      this.renderer.addClass(this.el.nativeElement, this.delay);
    }

    const options = {
      root: null,
      rootMargin: "0px",
      threshold: this.threshold,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Remove opacity-0 (animation class handles initial opacity)
          // Actually, if animation class has "from { opacity: 0 }", we are good.
          // But 'animate-fade-in-up' sets opacity: 0 initially in CSS.
          // So we just add the animation class.
          this.renderer.addClass(this.el.nativeElement, this.animationClass);

          // Stop observing once revealed
          if (this.observer) this.observer.unobserve(this.el.nativeElement);
        }
      });
    }, options);

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

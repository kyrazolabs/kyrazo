import {
    Component,
    ElementRef,
    ViewChild,
    AfterViewInit,
    OnDestroy,
    NgZone,
    HostListener,
    Inject,
    PLATFORM_ID,
    inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { Router, RouterLink } from '@angular/router';
import { PostHogService } from '@core/3rd-party/posthog';

interface BlobState {
    element: HTMLElement;
    originX: number;
    originY: number;
    currentX: number;
    currentY: number;
    targetX: number;
    targetY: number;
    radius: number; // approximate radius of the blob itself
    interactionRadius: number;
    maxOffset: number;
}

@Component({
    selector: 'app-landing-hero',
    standalone: true,
    imports: [CommonModule, ButtonModule, RippleModule, RouterLink],
    templateUrl: './hero.component.html',
    styleUrl: './hero.component.scss',
})
export class HeroComponent implements AfterViewInit, OnDestroy {
    @ViewChild('blob1') blob1Ref!: ElementRef<HTMLElement>;
    @ViewChild('blob2') blob2Ref!: ElementRef<HTMLElement>;

    private router = inject(Router);

    private blobs: BlobState[] = [];
    private animationFrameId: number | null = null;
    private mouseX = -9999;
    private mouseY = -9999;
    private isBrowser: boolean;

    private posthog = inject(PostHogService);

    constructor(
        private ngZone: NgZone,
        @Inject(PLATFORM_ID) platformId: Object,
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    trackEarlyAccess() {
        this.posthog.capture('hero_early_access_clicked');
        window.open(
            'https://dash.kyrazo.com/auth/register',
            '_top',
            'noopener,noreferrer',
        );
    }

    trackDocs() {
        this.posthog.capture('hero_docs_clicked');
        window.open('https://docs.kyrazo.com', '_blank', 'noopener,noreferrer');
    }

    ngAfterViewInit() {
        if (!this.isBrowser) return;

        this.initBlobs();

        // Start loop outside Angular to avoid change detection thrashing
        this.ngZone.runOutsideAngular(() => {
            this.animate();
        });
    }

    ngOnDestroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    @HostListener('window:resize')
    onResize() {
        if (this.isBrowser) {
            this.initBlobs();
        }
    }

    onMouseMove(event: MouseEvent) {
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
    }

    onMouseLeave() {
        this.mouseX = -9999;
        this.mouseY = -9999;
    }

    private initBlobs() {
        // Reset blobs array but keep config
        if (!this.blob1Ref || !this.blob2Ref) return;

        const elements = [
            { ref: this.blob1Ref, maxOffset: 60, interactionMult: 2 },
            { ref: this.blob2Ref, maxOffset: 80, interactionMult: 2.5 },
        ];

        this.blobs = elements.map((config) => {
            const el = config.ref.nativeElement;
            const rect = el.getBoundingClientRect();
            const radius = rect.width / 2; // Assuming circular/square
            const centerX = rect.left + radius;
            const centerY = rect.top + radius;

            return {
                element: el,
                originX: centerX,
                originY: centerY,
                currentX: 0,
                currentY: 0,
                targetX: 0,
                targetY: 0,
                radius: radius,
                interactionRadius: radius * config.interactionMult,
                maxOffset: config.maxOffset,
            };
        });
    }

    private animate() {
        this.blobs.forEach((blob) => {
            // Calculate distance from mouse to blob CENTER (origin)
            const dx = this.mouseX - blob.originX;
            const dy = this.mouseY - blob.originY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < blob.interactionRadius) {
                // Inside interaction radius: move towards cursor
                // Capped at maxOffset
                // We can use a linear falloff or just direct vector clamped

                // Normalize vector
                const dirX = dx / dist;
                const dirY = dy / dist;

                // Strength factor (0 at border, 1 at center) - optional,
                // but user asked for "bounded translation toward the cursor".
                // Let's just try to reach the mouse position but clamp magnitude.

                const offset = Math.min(dist, blob.maxOffset);
                blob.targetX = dirX * offset;
                blob.targetY = dirY * offset;
            } else {
                // Return to origin
                blob.targetX = 0;
                blob.targetY = 0;
            }

            // Lerp current to target
            // Factor 0.1 for smooth ease
            blob.currentX += (blob.targetX - blob.currentX) * 0.1;
            blob.currentY += (blob.targetY - blob.currentY) * 0.1;

            // Apply transform
            // We use translate3d for GPU acceleration
            blob.element.style.transform = `translate3d(${blob.currentX}px, ${blob.currentY}px, 0)`;
        });

        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
}

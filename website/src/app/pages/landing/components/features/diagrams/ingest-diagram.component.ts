import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '@components/service/layout.service';

@Component({
    selector: 'app-ingest-diagram',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div
            class="relative w-full h-full flex items-center justify-center py-4 overflow-hidden"
        >
            <!-- Diagram Container -->
            <div
                class="relative flex items-center justify-between w-full max-w-xl h-full px-4"
            >
                <!-- Sources (Left) -->
                <div class="flex flex-col gap-5 z-20">
                    <div
                        *ngFor="let source of sources"
                        class="flex items-center gap-3"
                    >
                        <div
                            class="w-9 h-9 p-1.5 rounded-xl bg-surface-800 flex items-center justify-center border border-surface-700 shadow-md"
                        >
                            <img
                                [src]="source.icon"
                                [alt]="source.name"
                                width="36"
                                height="36"
                                loading="lazy"
                                decoding="async"
                                class="h-full object-contain opacity-80"
                            />
                        </div>
                    </div>
                </div>

                <!-- Connection SVG Layer -->
                <svg
                    class="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 400 300"
                >
                    <defs>
                        <linearGradient
                            id="ingestFlow"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                        >
                            <stop
                                offset="0%"
                                stop-color="var(--primary-500)"
                                stop-opacity="0.1"
                            />
                            <stop
                                offset="100%"
                                stop-color="var(--primary-500)"
                                stop-opacity="0.4"
                            />
                        </linearGradient>
                    </defs>

                    <!-- Source to Center Pipes -->
                    <g *ngFor="let path of sourcePaths; let i = index">
                        <path
                            [attr.d]="path.d"
                            class="stroke-primary-500/10 fill-none stroke-3"
                        />
                        <path
                            [attr.d]="path.d"
                            class="stroke-primary-500/30 fill-none stroke-3 line-dash animation-delay"
                            [style.animation-delay]="i * 0.4 + 1.2 + 's'"
                        />
                    </g>

                    <!-- Center to Destinations Pipes -->
                    <g *ngFor="let path of destPaths; let i = index">
                        <path
                            [attr.d]="path.d"
                            class="stroke-primary-500/15 fill-none stroke-3"
                        />
                        <path
                            [attr.d]="path.d"
                            class="stroke-primary-500/40 fill-none stroke-3 line-dash animation-delay"
                            [style.animation-delay]="i * 0.4 + 1.5 + 's'"
                        />
                    </g>
                </svg>

                <!-- Kyrazo Ingest (Center) -->
                <div
                    class="relative z-20 w-14 h-14 rounded-xl bg-primary dark:bg-primary flex items-center justify-center shadow-2xl border-2 border-primary-300 dark:border-primary-800"
                >
                    <img
                        [src]="
                            isDarkMode() ? 'logo-dark.png' : 'logo-light.png'
                        "
                        alt="Kyrazo"
                        width="48"
                        height="48"
                        loading="lazy"
                        decoding="async"
                        class="h-12 p-1 rounded-xl bg-primary dark:bg-primary flex items-center justify-center transition-transform duration-300"
                    />

                    <div
                        class="absolute inset-0 rounded-xl border border-primary-500 animate-ping opacity-20"
                    ></div>
                </div>

                <!-- Destinations (Right) -->
                <div class="flex flex-col gap-10 z-20 items-end">
                    <div class="flex items-center gap-3 group">
                        <div
                            class="px-3 py-1.5 rounded-xl bg-surface-800 border border-surface-700 shadow-md flex items-center gap-2"
                        >
                            <i
                                class="pi pi-database text-primary-500 text-[10px]"
                            ></i>
                            <span
                                class="text-[10px] font-black uppercase tracking-widest text-surface-200"
                                >Storage</span
                            >
                        </div>
                    </div>
                    <div class="flex items-center gap-3 group">
                        <div
                            class="px-3 py-1.5 rounded-xl bg-surface-800 border border-surface-700 shadow-md flex items-center gap-2"
                        >
                            <i
                                class="pi pi-link text-primary-500 text-[10px]"
                            ></i>
                            <span
                                class="text-[10px] font-black uppercase tracking-widest text-surface-200"
                                >Endpoint</span
                            >
                        </div>
                    </div>
                </div>
            </div>

            <!-- Background Glow -->
            <div
                class="absolute inset-0 flex items-center justify-center pointer-events-none -z-10"
            >
                <div
                    class="w-32 h-32 bg-primary-500/5 blur-[60px] rounded-full"
                ></div>
            </div>
        </div>
    `,
    styles: [
        `
            .line-dash {
                stroke-dasharray: 4, 12;
                animation: dash 0.5s linear infinite;
            }
            @keyframes dash {
                to {
                    stroke-dashoffset: -48;
                }
            }
            .animation-delay {
                animation-duration: 1s;
            }
        `,
    ],
})
export class IngestDiagramComponent {
    layoutService: LayoutService = inject(LayoutService);
    isDarkMode = computed(() => this.layoutService.appState().darkMode);

    sources = [
        { name: 'Stripe', icon: 'logos/stripe.svg' },
        { name: 'GitHub', icon: 'logos/github.svg' },
        { name: 'Shopify', icon: 'logos/shopify.svg' },
    ];

    sourcePaths = [
        // Top
        { d: 'M-230,40 C0,40 0,150 100,150' },

        // Middle
        { d: 'M-230,150 L100,150' },

        // Bottom
        { d: 'M-230,260 C0,260 0,150 100,150' },
    ];

    // Center K to Destinations
    destPaths = [
        { d: 'M180,150 C280,150 280,95 500,80' }, // Center to Storage
        { d: 'M180,150 C280,150 280,205 500,225' }, // Center to Endpoint
    ];
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';
import { MAP_POINTS } from './map-points';
import { dropdownAnimation } from '@shared/animations/dropdown.animation';

@Component({
    selector: 'app-server-map',
    standalone: true,
    imports: [CommonModule, ScrollRevealDirective],
    template: `
        <div
            class="relative w-full py-28 overflow-hidden bg-surface-950 rounded-[3rem] border border-surface-800 shadow-2xl"
            appScrollReveal
        >
            <!-- Background Mesh -->
            <div
                class="absolute inset-0 opacity-20 pointer-events-none"
                style="background-image: radial-gradient(#3b82f6 0.5px, transparent 0.5px); background-size: 40px 40px;"
            ></div>

            <div class="relative z-10 max-w-7xl mx-auto px-6 text-center">
                <div
                    class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8"
                >
                    <div
                        class="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"
                    ></div>
                    <span
                        class="text-[10px] font-black uppercase tracking-[0.3em] text-primary-400"
                        >Global Infrastructure</span
                    >
                </div>

                <h2
                    class="text-4xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-[1.1]"
                >
                    Global Presence.<br />
                    <span class="text-primary-500">Local Latency.</span>
                </h2>

                <p
                    class="text-surface-400 text-lg md:text-xl max-w-3xl mx-auto mb-20 font-medium opacity-80"
                >
                    Dedicated workers reserved for your workload — no noisy
                    neighbors, no shared-queue contention.
                </p>

                <!-- The Map Container -->
                <div
                    class="relative aspect-21/9 w-full max-w-6xl mx-auto group/map"
                >
                    <!-- Dotted World Map (SVG) -->
                    <svg
                        viewBox="0 0 210 100"
                        class="w-full h-full opacity-30 group-hover/map:opacity-50 transition-opacity duration-1000"
                        aria-hidden="true"
                    >
                        <g class="fill-surface-400">
                            @for (p of points; track $index) {
                                <circle
                                    [attr.cx]="p.x"
                                    [attr.cy]="p.y"
                                    r="0.25"
                                    class="transition-all duration-700 hover:fill-primary-500 hover:scale-150"
                                />
                            }
                        </g>
                    </svg>

                    <!-- Stylized Connection Arcs -->
                    <svg
                        viewBox="0 0 210 100"
                        class="absolute inset-0 w-full h-full pointer-events-none opacity-40"
                        aria-hidden="true"
                    >
                        <path
                            d="M110,26 Q85,20 55,35"
                            class="stroke-primary-500 fill-none stroke-[0.3] line-dash"
                        />
                    </svg>

                    <!-- Location Markers -->

                    <!-- EU Nuremberg (Active) -->
                    <div
                        class="absolute top-[26%] left-[52.3%] -translate-x-1/2 -translate-y-1/2 group z-20 cursor-pointer"
                        (mouseenter)="hoveredMarker = 'eu'"
                        (mouseleave)="hoveredMarker = null"
                    >
                        <div
                            class="relative w-5 h-5 flex items-center justify-center"
                        >
                            <div
                                class="w-2 h-2 bg-surface-600 rounded-full border border-white/20 z-10 transition-colors group-hover:bg-green-500"
                                [class.bg-green-500]="hoveredMarker === 'eu'"
                            ></div>
                            <div
                                class="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-20 scale-150 group-hover:bg-green-500"
                                [class.bg-green-500]="hoveredMarker === 'eu'"
                            ></div>
                        </div>
                        <!-- Tooltip -->
                        @if (hoveredMarker === 'eu') {
                            <div
                                @dropdownAnimation
                                class="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 pointer-events-none z-50"
                            >
                                <div
                                    class="bg-surface-900/90 backdrop-blur-md border border-surface-700 px-4 py-2 rounded-xl shadow-2xl whitespace-nowrap"
                                >
                                    <div class="flex items-center gap-3">
                                        <span
                                            class="text-[11px] font-black uppercase text-white tracking-widest"
                                            >EU Nuremberg</span
                                        >
                                        <span
                                            class="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[9px] font-black tracking-widest"
                                            >ACTIVE</span
                                        >
                                    </div>
                                </div>
                            </div>
                        }
                    </div>

                    <!-- US Manassas (Soon) -->
                    <div
                        class="absolute top-[35%] left-[28.5%] -translate-x-1/2 -translate-y-1/2 group z-20 cursor-pointer"
                        (mouseenter)="hoveredMarker = 'us'"
                        (mouseleave)="hoveredMarker = null"
                    >
                        <div
                            class="relative w-4 h-4 flex items-center justify-center"
                        >
                            <div
                                class="w-2 h-2 bg-surface-600 rounded-full border border-white/20 z-10 transition-colors group-hover:bg-amber-500"
                                [class.bg-amber-500]="hoveredMarker === 'us'"
                            ></div>
                            <div
                                class="absolute -inset-1 rounded-full border border-surface-600/30 animate-pulse group-hover:border-amber-500/50"
                                [class.border-amber-500/50]="
                                    hoveredMarker === 'us'
                                "
                            ></div>
                        </div>
                        <!-- Tooltip -->
                        @if (hoveredMarker === 'us') {
                            <div
                                @dropdownAnimation
                                class="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 pointer-events-none z-50"
                            >
                                <div
                                    class="bg-surface-900/90 backdrop-blur-md border border-surface-700 px-4 py-2 rounded-xl shadow-2xl whitespace-nowrap"
                                >
                                    <div class="flex items-center gap-3">
                                        <span
                                            class="text-[11px] font-black uppercase text-white tracking-widest"
                                            >US Manassas</span
                                        >
                                        <span
                                            class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 text-[9px] font-black tracking-widest flex items-center gap-1"
                                        >
                                            SOON
                                            <span
                                                class="bg-amber-500/20 px-1.5 rounded text-[8px]"
                                                >BUN</span
                                            >
                                        </span>
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                </div>

                <!-- Infrastructure Metrics Grid -->
                <div
                    class="mt-24 grid grid-cols-2 md:grid-cols-4 gap-12 max-w-5xl mx-auto border-t border-surface-800/50 pt-16"
                >
                    <div class="flex flex-col items-center gap-2 group/stat">
                        <span
                            class="text-4xl font-black text-white tracking-tighter group-hover/stat:text-primary-500 transition-colors"
                            >Isolated</span
                        >
                        <span
                            class="text-[11px] uppercase font-bold text-surface-500 tracking-[0.25em]"
                            >Dedicated Workers</span
                        >
                    </div>
                    <div class="flex flex-col items-center gap-2 group/stat">
                        <span
                            class="text-4xl font-black text-white tracking-tighter group-hover/stat:text-primary-500 transition-colors"
                            >1:1</span
                        >
                        <span
                            class="text-[11px] uppercase font-bold text-surface-500 tracking-[0.25em]"
                            >Tenant Isolation</span
                        >
                    </div>
                    <div class="flex flex-col items-center gap-2 group/stat">
                        <span
                            class="text-4xl font-black text-white tracking-tighter group-hover/stat:text-primary-500 transition-colors"
                            >99.9%</span
                        >
                        <span
                            class="text-[11px] uppercase font-bold text-surface-500 tracking-[0.25em]"
                            >Reliability Sla</span
                        >
                    </div>
                    <div class="flex flex-col items-center gap-2 group/stat">
                        <span
                            class="text-4xl font-black text-white tracking-tighter group-hover/stat:text-primary-500 transition-colors"
                            >∞</span
                        >
                        <span
                            class="text-[11px] uppercase font-bold text-surface-500 tracking-[0.25em]"
                            >Scalability</span
                        >
                    </div>
                </div>
            </div>

            <!-- Corner Accent glows -->
            <div
                class="absolute -top-64 -left-64 w-[600px] h-[600px] bg-primary-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse"
            ></div>
            <div
                class="absolute -bottom-64 -right-64 w-[600px] h-[600px] bg-primary-600/5 blur-[120px] rounded-full pointer-events-none [animation-delay:2s]"
            ></div>
        </div>
    `,
    styles: [
        `
            .line-dash {
                stroke-dasharray: 1;
                animation: dash 30s linear infinite;
            }
            @keyframes dash {
                to {
                    stroke-dashoffset: -20;
                }
            }
        `,
    ],
    animations: [dropdownAnimation],
})
export class ServerMapComponent {
    points = MAP_POINTS;
    hoveredMarker: 'eu' | 'us' | null = null;
}

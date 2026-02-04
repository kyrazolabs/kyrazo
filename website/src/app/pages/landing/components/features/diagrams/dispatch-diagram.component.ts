import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '@components/service/layout.service';

@Component({
    selector: 'app-dispatch-diagram',
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
                <!-- Source (Left) -->
                <div class="z-20">
                    <div
                        class="px-3 py-2 rounded-xl bg-surface-800 border border-surface-700 shadow-md flex items-center gap-2"
                    >
                        <span
                            class="text-xs font-black uppercase tracking-widest text-surface-200"
                            >Producer</span
                        >
                    </div>
                </div>

                <!-- Connection SVG Layer -->
                <svg
                    class="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 400 300"
                    aria-hidden="true"
                >
                    <!-- Flow: Source to Center K -->
                    <path
                        d="M-100,150 L185,150"
                        class="stroke-primary-500/60 fill-none stroke-3 line-dash"
                    />

                    <!-- Flow: Center K to Targets -->
                    <g *ngFor="let path of dispatchPaths; let i = index">
                        <!-- Static Path -->
                        <path
                            [attr.d]="path.d"
                            class="stroke-primary-500/10 fill-none stroke-3"
                        />
                        <!-- Animated Flow -->
                        <path
                            [attr.d]="path.d"
                            class="stroke-primary-500/40 fill-none stroke-3 line-dash animation-delay"
                            [style.animation-delay]="i * 0.4 + 1.2 + 's'"
                        />
                    </g>
                </svg>

                <!-- Kyrazo Core (Center) -->
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

                <!-- Targets (Right) -->
                <div class="flex flex-col gap-8 z-20 items-end">
                    <div
                        *ngFor="let target of targets"
                        class="flex items-center gap-3"
                    >
                        <div
                            class="px-3 py-1.5 rounded-xl bg-surface-800 border border-surface-700 shadow-md flex items-center gap-2"
                        >
                            <i
                                class="pi pi-link text-primary-500 text-[10px]"
                            ></i>

                            <span
                                class="text-[10px] font-black uppercase tracking-widest text-surface-200"
                                >{{ target.name }}</span
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
export class DispatchDiagramComponent {
    layoutService: LayoutService = inject(LayoutService);
    isDarkMode = computed(() => this.layoutService.appState().darkMode);

    targets = [
        { name: 'Target 1', color: 'bg-green-500' },
        { name: 'Target 2', color: 'bg-amber-500' },
        { name: 'Target 3', color: 'bg-blue-500' },
    ];

    // Paths from central K (at 200 on X axis) to targets on the right
    dispatchPaths = [
        { d: 'M215,150 C400,150 290,30 540,30' }, // Top
        { d: 'M215,150 L540,150' }, // Middle
        { d: 'M215,150 C400,150 290,270 540,270' }, // Bottom
    ];
}

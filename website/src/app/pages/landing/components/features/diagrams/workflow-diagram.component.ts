import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '@components/service/layout.service';

@Component({
    selector: 'app-workflow-diagram',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div
            class="relative w-full h-[500px] flex items-center justify-center py-6 overflow-hidden"
        >
            <!-- Diagram Container -->
            <div
                class="relative flex items-center justify-between w-full max-w-5xl h-full"
            >
                <!-- Input Event (Left) -->
                <div class="z-20 translate-x-4">
                    <div
                        class="px-5 py-3 rounded-2xl bg-surface-800 border border-surface-200 dark:border-surface-800 flex items-center gap-4 shadow-xl shadow-black/5"
                    >
                        <div
                            class="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse"
                        ></div>
                        <div class="flex flex-col">
                            <span
                                class="text-xs font-black uppercase tracking-widest text-surface-0"
                                >Inbound Webhook</span
                            >
                        </div>
                    </div>
                </div>

                <!-- Connection SVG Layer -->
                <svg
                    class="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 700 500"
                    aria-hidden="true"
                >
                    <defs>
                        <linearGradient
                            id="pipeGradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                        >
                            <stop
                                offset="0%"
                                stop-color="var(--primary-500)"
                                stop-opacity="0.2"
                            />
                            <stop
                                offset="50%"
                                stop-color="var(--primary-500)"
                                stop-opacity="0.6"
                            />
                            <stop
                                offset="100%"
                                stop-color="var(--primary-500)"
                                stop-opacity="0.2"
                            />
                        </linearGradient>

                        <!-- Flow Indicator filter -->
                        <filter id="glow">
                            <feGaussianBlur
                                stdDeviation="2"
                                result="coloredBlur"
                            />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    <!-- Input to Center Pipe -->
                    <path
                        d="M100,250 L400,250"
                        class="stroke-primary-500/30 fill-none stroke-3 line-dash"
                    />

                    <!-- Center to Actions Pipes (S-Curves) -->
                    <g *ngFor="let path of actionPaths; let i = index">
                        <!-- Background Pipe -->
                        <path
                            [attr.d]="path.d"
                            class="stroke-primary-500/10 fill-none stroke-2"
                        />
                        <!-- Animated Flow -->
                        <path
                            [attr.d]="path.d"
                            class="stroke-primary-500/40 fill-none stroke-3 line-dash animation-delay"
                            [style.animation-delay]="i * 0.4 + 's'"
                        />
                    </g>
                </svg>

                <!-- Kyrazo Center -->
                <div
                    class="relative z-20 w-16 h-16 rounded-2xl bg-primary dark:bg-primary flex flex-col items-center justify-center shadow-2xl shadow-primary-500/30 border-2 border-primary-300 dark:border-primary-800 group/center transition-transform duration-500 cursor-help"
                >
                    <img
                        [src]="
                            isDarkMode() ? 'logo-dark.png' : 'logo-light.png'
                        "
                        alt="Kyrazo"
                        width="56"
                        height="56"
                        loading="lazy"
                        decoding="async"
                        class="h-14 p-1 rounded-xl bg-primary dark:bg-primary flex items-center justify-center transition-transform duration-300"
                    />
                    <!-- Center Pulse Rings -->
                    <div
                        class="absolute inset-0 rounded-2xl border-2 border-primary-500 animate-ping opacity-20"
                    ></div>
                    <div
                        class="absolute -inset-4 rounded-3xl border border-primary-500/10 animate-pulse"
                    ></div>
                </div>

                <!-- Actions (Right) -->
                <div class="flex flex-col gap-20 z-20 -translate-x-4">
                    <div
                        *ngFor="let action of actions"
                        class="flex items-center gap-5 group cursor-default"
                    >
                        <div
                            class="w-30 h-10 p-2 rounded-2xl bg-surface-800 flex items-center justify-center border border-surface-200 dark:border-surface-800 shadow-md shadow-black/5 transition-all group-hover:border-primary-500/50 group-hover:shadow-primary-500/10"
                        >
                            <img
                                [src]="action.icon"
                                [alt]="action.name"
                                width="120"
                                height="40"
                                loading="lazy"
                                decoding="async"
                                class="p-0.5 h-full opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Enhanced Global Background Glow -->
            <div
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary-500/5 blur-[150px] rounded-full pointer-events-none -z-10"
            ></div>
        </div>
    `,
    styles: [
        `
            @keyframes float {
                0%,
                100% {
                    transform: translateY(0);
                }
                50% {
                    transform: translateY(-12px);
                }
            }

            .line-dash {
                stroke-dasharray: 4, 12;
                animation: dash 1s linear infinite;
            }

            @keyframes dash {
                to {
                    stroke-dashoffset: -48;
                }
            }

            .animation-delay {
                animation-duration: 2s;
            }
        `,
    ],
})
export class WorkflowDiagramComponent {
    layoutService: LayoutService = inject(LayoutService);
    isDarkMode = computed(() => this.layoutService.appState().darkMode);

    actions = [
        { name: 'Resend', icon: 'logos/resend.svg' },
        { name: 'Stripe', icon: 'logos/stripe.svg' },
        { name: 'Slack', icon: 'logos/slack.png' },
    ];

    // Manual SVG paths for curved pipes from center (400, 250) to right elements
    // The endpoints are roughly coordinate-aligned with the action card positions
    actionPaths = [
        { d: 'M400,250 C550,250 550,115 690,115' }, // Top Action (Resend)
        { d: 'M400,250 C550,250 550,250 690,250' }, // Middle Action (Zapier)
        { d: 'M400,250 C550,250 550,385 690,385' }, // Bottom Action (PayPal)
    ];
}

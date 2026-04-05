import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '@components/service/layout.service';

@Component({
    selector: 'app-dispatch-diagram',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dispatch.component.html',
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
            .pipeline-flow {
                stroke-dasharray: 40 400; /* 40px comet, 400px gap */
                stroke-dashoffset: 440;
                animation: comet-move 3s linear infinite;
                will-change: stroke-dashoffset;
            }
            @keyframes comet-move {
                to {
                    stroke-dashoffset: 0;
                }
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
        {
            d: 'M215,150 L368,150 A32,32 0 0 0 400,118 L400,62 A32,32 0 0 1 432,30 L540,30',
        }, // Top
        { d: 'M215,150 L540,150' }, // Middle
        {
            d: 'M215,150 L368,150 A32,32 0 0 1 400,182 L400,238 A32,32 0 0 0 432,270 L540,270',
        }, // Bottom
    ];
}

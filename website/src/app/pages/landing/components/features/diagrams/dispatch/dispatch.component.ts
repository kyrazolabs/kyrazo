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

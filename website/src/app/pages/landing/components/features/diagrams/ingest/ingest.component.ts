import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '@components/service/layout.service';

@Component({
    selector: 'app-ingest-diagram',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './ingest.component.html',
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
export class IngestDiagramComponent {
    layoutService: LayoutService = inject(LayoutService);
    isDarkMode = computed(() => this.layoutService.appState().darkMode);

    sources = [
        { name: 'Stripe', iconClass: 'icon-[logos--stripe]' },
        { name: 'GitHub', iconClass: 'icon-[bytesize--github]' },
        { name: 'Shopify', iconClass: 'icon-[logos--shopify]' },
    ];

    sourcePaths = [
        // Top
        {
            d: 'M-230,40 L-182,40 A32,32 0 0 1 -150,72 L-150,118 A32,32 0 0 0 -118,150 L100,150',
        },

        // Middle
        { d: 'M-230,150 L100,150' },

        // Bottom
        {
            d: 'M-230,260 L-182,260 A32,32 0 0 0 -150,228 L-150,182 A32,32 0 0 1 -118,150 L100,150',
        },
    ];

    // Center K to Destinations
    destPaths = [
        {
            d: 'M180,150 L388,150 A32,32 0 0 0 420,118 L420,112 A32,32 0 0 1 452,80 L500,80',
        }, // Center to Storage
        {
            d: 'M180,150 L388,150 A32,32 0 0 1 420,182 L420,193 A32,32 0 0 0 452,225 L500,225',
        }, // Center to Endpoint
    ];
}

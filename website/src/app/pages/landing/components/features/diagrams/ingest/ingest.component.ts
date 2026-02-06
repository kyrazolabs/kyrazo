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

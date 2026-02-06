import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '@components/service/layout.service';

@Component({
    selector: 'app-workflow-diagram',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './workflow.component.html',
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
        { name: 'Mailgun', iconClass: 'icon-[logos--mailgun-icon]' },
        { name: 'Airtable', iconClass: 'icon-[logos--airtable]' },
        { name: 'Slack', iconClass: 'icon-[logos--slack-icon]' },
    ];

    // Manual SVG paths for curved pipes from center (400, 250) to right elements
    // The endpoints are roughly coordinate-aligned with the action card positions
    actionPaths = [
        { d: 'M400,250 C550,250 550,115 690,115' }, // Top Action (Resend)
        { d: 'M400,250 C550,250 550,250 690,250' }, // Middle Action (Zapier)
        { d: 'M400,250 C550,250 550,385 690,385' }, // Bottom Action (PayPal)
    ];
}

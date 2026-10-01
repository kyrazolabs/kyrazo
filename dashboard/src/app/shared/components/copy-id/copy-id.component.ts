import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ClipboardService } from '@core/services/clipboard.service';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-copy-id',
    standalone: true,
    imports: [CommonModule, ButtonModule, TooltipModule, ToastModule],
    templateUrl: './copy-id.component.html',
    styles: [
        `
            :host {
                display: inline-block;
            }
        `,
    ],
})
export class CopyIdComponent {
    @Input({ required: true }) id!: string;
    @Input() fullWidth: boolean = false;

    private readonly clipboard = inject(ClipboardService);

    copy(event: MouseEvent): void {
        event.stopPropagation();
        this.clipboard.copy(this.id, 'ID Copied');
    }
}

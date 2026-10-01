import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-avatar-selection-dialog',
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule, TooltipModule],
    templateUrl: './avatar-selection-dialog.component.html',
    styles: [
        `
            :host ::ng-deep .p-dialog-content {
                padding: 0;
            }
        `,
    ],
})
export class AvatarSelectionDialogComponent {
    @Input() visible = false;
    @Input() currentAvatar: string | null = null;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() avatarSelected = new EventEmitter<string>();
    @Output() onHide = new EventEmitter<void>();

    avatars: string[] = Array.from({ length: 100 }, (_, i) => `AV${i + 1}.png`);

    getAvatarUrl(avatar: string | null | undefined): string {
        if (!avatar) return 'assets/images/default-avatar.png';
        return `avatars/${avatar}`;
    }

    selectAvatar(avatar: string) {
        this.avatarSelected.emit(avatar);
    }
}

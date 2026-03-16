import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ClipboardService {
  private readonly messageService = inject(MessageService);

  /**
   * Copies text to the clipboard and shows a success toast.
   * @param text The text to copy.
   * @param summary Optional summary for the toast.
   */
  async copy(text: string, summary: string = 'Copied'): Promise<void> {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      this.messageService.add({
        severity: 'success',
        summary: summary,
        detail: 'Copied to clipboard',
        life: 3000
      });
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy to clipboard',
        life: 3000
      });
    }
  }
}

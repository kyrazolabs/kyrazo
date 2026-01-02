import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
     <div
        class="bg-transparent p-6 rounded-2xl mx-auto border border-surface-200 dark:border-surface-700 w-full"
    >
        <div class="flex justify-between items-center sm:flex-row flex-col gap-2">
            <div class="text-sm text-surface-600 dark:text-surface-400">202X Hookster.</div>
            <div class="flex gap-4">
                <a
                    href="https://twitter.com/nx_2io"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-surface-600 dark:text-surface-400 hover:text-primary transition-colors text-sm"
                >
                    <i class="pi pi-twitter text-xl"></i>
                </a>
                <a
                    href="https://primeng.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-surface-600 dark:text-surface-400 hover:text-primary transition-colors text-sm"
                >
                    <i class="pi pi-globe text-xl"></i>
                </a>
                <a
                    href="https://github.com/primefaces/primeng"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-surface-600 dark:text-surface-400 hover:text-primary transition-colors text-sm"
                >
                    <i class="pi pi-github text-xl"></i>
                </a>
            </div>
        </div>
    </div>
  `,
})
export class AppFooter {

}

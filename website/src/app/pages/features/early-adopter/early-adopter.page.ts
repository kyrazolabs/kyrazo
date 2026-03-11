import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    standalone: true,
    selector: 'app-early-adopter',
    imports: [CommonModule],
    template: `
        <div class="min-h-screen bg-surface-0 dark:bg-surface-950 pt-24 md:pt-32 pb-16 md:pb-24">
            <div class="px-4 md:px-6 max-w-7xl mx-auto text-center">
                <h1 class="text-4xl md:text-7xl font-bold mb-8 text-surface-900 dark:text-surface-0 tracking-tight">Early Adopter Program</h1>
                <p class="text-lg md:text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
                    Details about our early adopter benefits and founding engineering access are coming soon.
                </p>
            </div>
        </div>
    `,
})
export class EarlyAdopterPage {}

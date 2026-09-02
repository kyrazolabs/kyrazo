import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderThemeDirective } from '@shared/directives/header-theme.directive';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';
import { CtaComponent } from '@pages/landing/components/cta/cta.component';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule, HeaderThemeDirective, ScrollRevealDirective, CtaComponent],
    template: `
        <div class="relative min-h-screen bg-surface-0 dark:bg-surface-950 pt-32" appHeaderTheme="dark">
            <div class="max-w-4xl mx-auto px-6 text-center" appScrollReveal>
                <h1 class="text-4xl md:text-6xl font-black mb-8 text-surface-900 dark:text-surface-0 tracking-tighter">
                    Built for <span class="text-primary-500 font-sansation!">Isolation</span>.
                </h1>
                <p class="text-lg md:text-xl text-surface-600 dark:text-surface-400 leading-relaxed mb-16">
                    Kyrazo was born out of a simple frustration: modern event-driven architectures shouldn't be subjected to the "noisy neighbor" problems of shared infrastructure. We believe enterprise webhooks demand physical isolation, predictable latency, and dedicated compute.
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mb-24">
                    <div class="p-8 rounded-2xl bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-800">
                        <i class="icon-[hugeicons--server-stack-03] text-3xl text-primary-500 mb-4 block"></i>
                        <h3 class="text-xl font-bold mb-3 text-surface-900 dark:text-surface-0">Dedicated Compute</h3>
                        <p class="text-surface-600 dark:text-surface-400">Every enterprise deployment runs on its own isolated virtual machines. Your webhook deliveries are never throttled by another company's traffic spike.</p>
                    </div>
                    <div class="p-8 rounded-2xl bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-800">
                        <i class="icon-[hugeicons--database] text-3xl text-primary-500 mb-4 block"></i>
                        <h3 class="text-xl font-bold mb-3 text-surface-900 dark:text-surface-0">Isolated Data</h3>
                        <p class="text-surface-600 dark:text-surface-400">Zero shared database memory. Your event logs, payloads, and retry queues are physically separated, ensuring the highest level of security and compliance.</p>
                    </div>
                </div>
            </div>

            <app-landing-cta></app-landing-cta>
        </div>
    `
})
export class AboutPage {}

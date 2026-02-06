import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
} from 'primeng/accordion';
import { StyleClass } from 'primeng/styleclass';
import { Button } from 'primeng/button';

interface FaqItem {
    question: string;
    answer: string;
    category: string;
}

@Component({
    selector: 'app-landing-faq',
    standalone: true,
    imports: [CommonModule],
    template: `
        <section class="py-32 bg-transparent relative overflow-hidden" id="faq">
            <div class="max-w-4xl mx-auto px-6 relative z-10">
                <div
                    class="text-center mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                    <div
                        class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6"
                    >
                        <span
                            class="text-[10px] font-black uppercase tracking-[0.3em] text-primary-400"
                            >Support</span
                        >
                    </div>
                    <h2
                        class="text-4xl md:text-6xl font-black text-surface-950 dark:text-white tracking-tighter mb-6 leading-tight"
                    >
                        Frequently Asked
                        <span class="text-primary-500">Questions.</span>
                    </h2>
                    <p
                        class="text-surface-600 dark:text-surface-400 text-lg md:text-xl font-medium max-w-2xl mx-auto"
                    >
                        Everything you need to know about building resilient
                        event-driven systems with Kyrazo.
                    </p>
                </div>

                <div class="space-y-3">
                    @for (item of faqs; track item.question) {
                        <div
                            class="group rounded-2xl border border-surface-200 dark:border-surface-800/60 bg-surface-0/40 dark:bg-surface-900/40 transition-all duration-300 overflow-hidden"
                            [class.border-primary-500/30]="
                                activeIndex === $index
                            "
                            [class.bg-surface-50/50]="activeIndex === $index"
                            [class.dark:bg-surface-900/60]="
                                activeIndex === $index
                            "
                        >
                            <button
                                (click)="toggle($index)"
                                class="w-full text-left py-4 px-6 flex items-center justify-between gap-4 group/btn outline-hidden"
                                [attr.aria-expanded]="activeIndex === $index"
                                [attr.aria-controls]="'faq-content-' + $index"
                                [attr.id]="'faq-button-' + $index"
                            >
                                <span
                                    class="text-lg md:text-xl font-bold tracking-tight text-surface-950 dark:text-white transition-colors duration-300"
                                    [class.text-primary-500]="
                                        activeIndex === $index
                                    "
                                >
                                    {{ item.question }}
                                </span>
                                <div
                                    class="w-8 h-8 rounded-full border border-surface-200 dark:border-surface-800 flex items-center justify-center transition-all duration-300 shrink-0 pt-0.5"
                                    [class.rotate-180]="activeIndex === $index"
                                    [class.bg-primary-500]="
                                        activeIndex === $index
                                    "
                                    [class.border-primary-500]="
                                        activeIndex === $index
                                    "
                                    [class.text-white]="activeIndex === $index"
                                    aria-hidden="true"
                                >
                                    <i
                                        class="icon-[hugeicons--arrow-down-01] size-6"
                                    ></i>
                                </div>
                            </button>

                            <div
                                class="grid transition-all duration-300 ease-in-out"
                                [style.grid-template-rows]="
                                    activeIndex === $index ? '1fr' : '0fr'
                                "
                                [attr.id]="'faq-content-' + $index"
                                [attr.aria-hidden]="activeIndex !== $index"
                                role="region"
                                [attr.aria-labelledby]="'faq-button-' + $index"
                            >
                                <div class="overflow-hidden">
                                    <div
                                        class="px-6 pb-6 text-surface-600 dark:text-surface-400 leading-relaxed text-lg font-medium animate-in fade-in duration-500"
                                    >
                                        {{ item.answer }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                </div>

                <div
                    class="mt-20 p-10 rounded-2xl bg-surface-50/30 dark:bg-surface-900/30 border border-surface-200 dark:border-surface-800/50 backdrop-blur-2xl text-center"
                >
                    <h3
                        class="text-2xl font-bold text-surface-950 dark:text-white mb-3 tracking-tight"
                    >
                        Still have questions?
                    </h3>
                    <p
                        class="text-surface-600 dark:text-surface-400 mb-8 max-w-md mx-auto font-medium"
                    >
                        Can't find the answer you're looking for? Reach out to
                        our engineering team.
                    </p>
                    <a
                        href="mailto:support@kyrazo.com"
                        class="inline-flex items-center px-8! py-3 p-button font-semibold! rounded-xl"
                    >
                        Contact Support
                    </a>
                </div>
            </div>
        </section>
    `,
})
export class FaqComponent {
    activeIndex: number | null = null;

    toggle(index: number) {
        this.activeIndex = this.activeIndex === index ? null : index;
    }
    faqs: FaqItem[] = [
        {
            category: 'General',
            question: 'What is Kyrazo?',
            answer: 'Kyrazo is a webhook gateway and event orchestration platform designed to help teams reliably receive, process, and route events between systems.',
        },
        {
            category: 'Technical',
            question: 'How does Kyrazo handle traffic spikes?',
            answer: 'Kyrazo is built with scalability in mind. It uses asynchronous processing and horizontally scalable workers to handle increased event volume while maintaining stable ingestion.',
        },
        {
            category: 'Security',
            question: 'Is my data protected during transmission?',
            answer: 'Yes. All data is transmitted over secure TLS connections. Kyrazo also supports request verification mechanisms, such as signatures, to help ensure payload integrity.',
        },
        {
            category: 'Reliability',
            question: 'What happens if a destination endpoint is unavailable?',
            answer: 'If a delivery attempt fails, Kyrazo can retry delivery based on configurable retry policies. Failed attempts are recorded to help with troubleshooting and observability.',
        },
        {
            category: 'Integration',
            question: 'Do I need to modify my existing code?',
            answer: 'In many cases, no changes are required. You can point your existing webhooks to Kyrazo’s ingestion endpoint. For more advanced use cases, SDKs are available for Node.js, Python, and Go.',
        },
    ];
}

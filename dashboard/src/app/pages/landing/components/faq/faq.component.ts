import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  Accordion,
  AccordionPanel,
  AccordionHeader,
  AccordionContent,
} from "primeng/accordion";
import { StyleClass } from "primeng/styleclass";
import { Button } from "primeng/button";

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

@Component({
  selector: "app-landing-faq",
  standalone: true,
  imports: [
    CommonModule,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
  ],
  template: `
    <section class="py-32 bg-transparent relative overflow-hidden" id="faq">
      <div class="max-w-4xl mx-auto px-6 relative z-10">
        <div class="text-center mb-20">
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
            Frequently Asked <span class="text-primary-500">Questions.</span>
          </h2>
          <p
            class="text-surface-600 dark:text-surface-400 text-lg md:text-xl font-medium max-w-2xl mx-auto"
          >
            Everything you need to know about building resilient event-driven
            systems with Kyrazo.
          </p>
        </div>

        <div class="space-y-4 ">
          <p-accordion [multiple]="false">
            <p-accordion-panel
              *ngFor="let item of faqs"
              [value]="item.question"
              styleClass="border-b border-surface-200 dark:border-surface-900/50 block"
            >
              <p-accordion-header class="w-full">
                <span
                  class="text-xl font-bold tracking-tight text-surface-950 dark:text-white hover:text-primary-500 transition-colors"
                  >{{ item.question }}</span
                >
              </p-accordion-header>
              <p-accordion-content>
                <div
                  class="pb-8 pt-2 text-surface-600 dark:text-surface-400  leading-relaxed text-lg font-medium"
                >
                  {{ item.answer }}
                </div>
              </p-accordion-content>
            </p-accordion-panel>
          </p-accordion>
        </div>

        <div
          class="mt-20 p-10 rounded-2xl bg-surface-100 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-900 backdrop-blur-sm text-center"
        >
          <h3
            class="text-2xl font-bold text-surface-950 dark:text-white mb-3 tracking-tight"
          >
            Still have questions?
          </h3>
          <p
            class="text-surface-600 dark:text-surface-400 mb-8 max-w-md mx-auto"
          >
            Can't find the answer you're looking for? Reach out to our
            engineering team.
          </p>
          <a
            href="mailto:support@kyrazo.com"
            class="px-6 py-1.5 bg-surface-950 dark:bg-white text-white dark:text-black font-black rounded-2xl hover:bg-primary-700 hover:text-white transition-all duration-300 shadow-xl shadow-surface-950/10 dark:shadow-white/5"
          >
            Contact Support
          </a>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      :host ::ng-deep {
        .custom-accordion {
          .p-accordion-header {
            background: transparent !important;
            border: none !important;
            padding: 2rem 0 !important;
            color: inherit !important;

            &:hover {
              background: transparent !important;
            }

            .p-accordion-header-content {
              display: flex !important;
              justify-content: space-between !important;
              width: 100% !important;
              align-items: center !important;
            }
          }

          .p-accordion-panel-active .p-accordion-header {
            color: var(--primary-500) !important;
          }

          .p-accordion-content {
            background: transparent !important;
            border: none !important;
            color: inherit !important;
            padding: 0 !important;
          }

          /* Hide the default icon if needed or style it */
          .p-accordion-header-icon {
            color: var(--primary-500) !important;
            order: 1 !important;
          }
        }
      }
    `,
  ],
})
export class FaqComponent {
  faqs: FaqItem[] = [
    {
      category: "General",
      question: "What is Kyrazo?",
      answer:
        "Kyrazo is a webhook gateway and event orchestration platform designed to help teams reliably receive, process, and route events between systems.",
    },
    {
      category: "Technical",
      question: "How does Kyrazo handle traffic spikes?",
      answer:
        "Kyrazo is built with scalability in mind. It uses asynchronous processing and horizontally scalable workers to handle increased event volume while maintaining stable ingestion.",
    },
    {
      category: "Security",
      question: "Is my data protected during transmission?",
      answer:
        "Yes. All data is transmitted over secure TLS connections. Kyrazo also supports request verification mechanisms, such as signatures, to help ensure payload integrity.",
    },
    {
      category: "Reliability",
      question: "What happens if a destination endpoint is unavailable?",
      answer:
        "If a delivery attempt fails, Kyrazo can retry delivery based on configurable retry policies. Failed attempts are recorded to help with troubleshooting and observability.",
    },
    {
      category: "Integration",
      question: "Do I need to modify my existing code?",
      answer:
        "In many cases, no changes are required. You can point your existing webhooks to Kyrazo’s ingestion endpoint. For more advanced use cases, SDKs are available for Node.js, Python, and Go.",
    },
  ];
}

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
    templateUrl: './faq.component.html',
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

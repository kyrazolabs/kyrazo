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
            answer: 'Kyrazo is dedicated webhook infrastructure for enterprise B2B. Each customer gets physically isolated compute, databases, and delivery workers to ingest, process, and dispatch events — with no noisy-neighbor sharing.',
        },
        {
            category: 'Sales',
            question: 'Is Kyrazo self-serve?',
            answer: 'No. Access is provisioned after a discovery meeting and an executed Order Form. There is no public signup or in-product checkout.',
        },
        {
            category: 'Pricing',
            question: 'How much does Professional cost?',
            answer: 'Professional is $499 per month on an annual contract. Enterprise is custom billed ($1,000–$5,000+ per month). A one-time onboarding and security setup fee ($500–$1,500) applies to new dedicated deployments.',
        },
        {
            category: 'Trial',
            question: 'Do you offer a free trial?',
            answer: 'No. A discovery meeting is free and does not provision servers. Dedicated infrastructure is spun up only after an Order Form and the one-time onboarding fee ($500–$1,500), which is non-refundable once provisioning starts.',
        },
        {
            category: 'Reliability',
            question: 'What happens if a destination endpoint is unavailable?',
            answer: 'If a delivery attempt fails, Kyrazo retries based on configurable retry policies. Failed attempts are recorded to help with troubleshooting and observability.',
        },
        {
            category: 'Integration',
            question: 'Do I need to modify my existing code?',
            answer: 'Often no. After provisioning you receive a dedicated hostname — a Kyrazo subdomain or your own domain — for the dashboard and API. Point existing webhooks at that ingest URL. There is no shared api.kyrazo.com or public signup. SDKs are available for Node.js, Python, and Go.',
        },
    ];
}

import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";

import { ScrollRevealDirective } from "@shared/directives/scroll-reveal.directive";

@Component({
  selector: "app-landing-pricing",
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, ScrollRevealDirective],
  templateUrl: "./pricing.component.html",
  styleUrl: "./pricing.component.scss",
})
export class PricingComponent {
  plans = [
    {
      name: "Free",
      price: "€0",
      period: "/month",
      features: [
        "5 events/sec",
        "10,000 events/month",
        "1 Project",
        "1 Member / 2 Connectors",
        "3 Integrations",
        "5 Concurrent Workers",
        "€4/100k overage",
      ],
      cta: "Start Free",
      highlighted: false,
    },
    {
      name: "Starter",
      price: "€29",
      period: "/month",
      features: [
        "25 events/sec",
        "100,000 events/month",
        "5 Projects / 5 Members",
        "10 Connectors",
        "15 Integrations",
        "20 Concurrent Workers",
        "€3.50/100k overage",
      ],
      cta: "Go Starter",
      highlighted: false,
    },
    {
      name: "Professional",
      price: "€99",
      period: "/month",
      features: [
        "100 events/sec",
        "1,000,000 events/month",
        "20 Projects / 15 Members",
        "50 Connectors",
        "100 Integrations",
        "50 Concurrent Workers",
        "€3/100k overage",
      ],
      cta: "Go Pro",
      highlighted: true,
      tag: "BEST FOR TEAMS",
    },
    {
      name: "Enterprise",
      price: "€499",
      period: "/month",
      features: [
        "500 events/sec",
        "10,000,000 events/month",
        "Unlimited Projects",
        "Unlimited Members/Connectors",
        "200 Concurrent Workers",
        "€2.50/100k overage",
        "Priority support",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];
}

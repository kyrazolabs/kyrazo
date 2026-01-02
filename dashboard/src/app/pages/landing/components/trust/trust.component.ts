import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

interface TrustItem {
  title: string;
  description: string;
  icon: string;
  metric?: string;
  category: "Scalability" | "Security" | "Compliance";
}

import { ScrollRevealDirective } from "@shared/directives/scroll-reveal.directive";

@Component({
  selector: "app-landing-trust",
  standalone: true,
  imports: [CommonModule, ScrollRevealDirective],
  template: `
    <div
      class="relative w-full py-28 overflow-hidden bg-surface-950 rounded-[3rem] border border-surface-800 shadow-lg"
      id="trust"
    >
      <!-- Background Mesh -->
      <div
        class="absolute inset-0 opacity-10 pointer-events-none"
        style="background-image: radial-gradient(#3b82f6 2px, transparent 2px); background-size: 30px 30px;"
      ></div>

      <div class="max-w-7xl mx-auto px-6 relative z-10">
        <div
          class="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20"
        >
          <div class="max-w-2xl" appScrollReveal>
            <div
              class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6"
            >
              <span
                class="text-[10px] font-black uppercase tracking-[0.3em] text-primary-400"
                >Enterprise Grade</span
              >
            </div>
            <h2
              class="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight mb-4"
            >
              Scalable, secure, and
              <span class="text-primary-500">compliant.</span>
            </h2>
            <p class="text-surface-400 text-lg md:text-xl font-medium">
              Built for the most demanding workloads, Kyrazo provides the
              infrastructure and certifications your enterprise requires.
            </p>
          </div>
          <div class="hidden md:block">
            <!-- <a
              href="https://kyrazo.instatus.com"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 border mb-4 px-3 py-1.5 rounded-2xl bg-surface-900/50 border-surface-800 backdrop-blur-sm"
            >
              <span
                class="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30
                    dark:ring-emerald-400/30"
              ></span>

              <span class="text-sm font-bold text-white tracking-tight">
                All systems operational
              </span>
            </a> -->
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            *ngFor="let item of items; let i = index"
            appScrollReveal
            [delay]="'delay-' + (i * 100 + 100)"
            class="group p-6 rounded-2xl bg-surface-900/30 border border-surface-800/50 hover:border-primary-500/50 hover:bg-surface-900/50 transition-all duration-500 relative overflow-hidden"
          >
            <!-- Glow Effect -->
            <div
              class="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/5 blur-[60px] rounded-full group-hover:bg-primary-500/10 transition-all duration-700"
            ></div>

            <div class="relative z-10">
              <div class="flex items-start justify-between mb-8">
                <div
                  class="w-12 h-12 rounded-xl bg-surface-800 border border-surface-700 flex items-center justify-center text-primary-500 group-hover:bg-primary-500/10 group-hover:border-primary-500/20 transition-all duration-500"
                >
                  <span
                    class="material-icons-outlined text-2xl"
                    [innerHTML]="item.icon"
                  ></span>
                </div>
                <span
                  *ngIf="item.metric"
                  class="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-primary-500/10 text-primary-400 border border-primary-500/20"
                >
                  {{ item.metric }}
                </span>
              </div>

              <h3
                class="text-xl font-bold text-white mb-3 tracking-tight group-hover:text-primary-300 transition-colors"
              >
                {{ item.title }}
              </h3>
              <p
                class="text-surface-400 leading-relaxed font-medium opacity-80 group-hover:opacity-100 transition-opacity"
              >
                {{ item.description }}
              </p>
            </div>
          </div>
        </div>

        <!-- Compliance Badges -->
        <!-- <div
          appScrollReveal
          delay="delay-300"
          class="mt-24 flex flex-wrap items-center justify-center gap-12 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1.5"
            >
              <svg viewBox="0 0 24 24" class="w-full h-full fill-black">
                <path
                  d="M12 2L4.5 5.5v5c0 4.6 3.2 8.9 7.5 10 4.3-1.1 7.5-5.4 7.5-10v-5L12 2zm0 15.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z"
                />
              </svg>
            </div>
            <span
              class="text-sm font-black uppercase tracking-[0.2em] text-white"
              >SoC2 Type II</span
            >
          </div>
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1.5 text-[10px] font-black text-black"
            >
              GDPR
            </div>
            <span
              class="text-sm font-black uppercase tracking-[0.2em] text-white"
              >Compliance</span
            >
          </div>
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1.5 text-[10px] font-black text-black"
            >
              CCPA
            </div>
            <span
              class="text-sm font-black uppercase tracking-[0.2em] text-white"
              >Data Privacy</span
            >
          </div>
        </div> -->
      </div>
    </div>
  `,
  styles: [
    `
      @import url("https://fonts.googleapis.com/icon?family=Material+Icons+Outlined");
    `,
  ],
})
export class TrustComponent {
  items: TrustItem[] = [
    {
      title: "High Availability Architecture",
      description:
        "Redundant systems and fault-tolerant design help ensure reliable webhook delivery with minimal downtime.",
      icon: "dns",
      metric: "Reliability",
      category: "Scalability",
    },
    {
      title: "Low-Latency Delivery",
      description:
        "Optimized webhook routing designed to achieve fast delivery times across supported regions.",
      icon: "speed",
      metric: "Performance",
      category: "Scalability",
    },
    {
      title: "Scalable Concurrency",
      description:
        "Handle high volumes of concurrent webhooks using horizontally scalable workers that adapt to load.",
      icon: "bolt",
      metric: "Throughput",
      category: "Scalability",
    },
    {
      title: "Security Best Practices",
      description:
        "Our platform follows industry-standard security practices for access control, isolation, and data protection.",
      icon: "verified_user",
      category: "Compliance",
    },
    {
      title: "GDPR & Privacy-Ready",
      description:
        "Designed to support data protection requirements such as access, deletion, and portability in line with GDPR and similar regulations.",
      icon: "gavel",
      category: "Compliance",
    },
    {
      title: "Encrypted Data Handling",
      description:
        "Webhook data is protected using modern encryption standards during transmission and storage.",
      icon: "lock",
      category: "Security",
    },

    // {
    //   title: "Single Sign-On (SSO)",
    //   description:
    //     "Seamless integration with Okta, Azure AD, Google Workspace, and other enterprise identity providers.",
    //   icon: "vpn_key",
    //   category: "Security",
    // },
    // {
    //   title: "Advanced Authentication",
    //   description:
    //     "Support for HMAC signatures, OAuth 2.0, API keys, and custom authentication schemes for maximum security.",
    //   icon: "security",
    //   category: "Security",
    // },
    // {
    //   title: "Granular Access Control",
    //   description:
    //     "Role-based permissions system lets you control exactly who can view, manage, and configure webhooks.",
    //   icon: "groups",
    //   category: "Security",
    // },
  ];
}

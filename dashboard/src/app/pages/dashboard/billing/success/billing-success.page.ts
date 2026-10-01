import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SettingService } from '@core/services/settings.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { SubscriptionService } from '@core/services/subscription.service';

@Component({
    selector: 'app-billing-success',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ButtonModule,
        CardModule,
        ProgressSpinnerModule,
        MessageModule,
    ],
    template: `
        <div
            class="flex flex-col w-full mx-auto gap-8 flex-1 animate-fade-in p-4 lg:p-6"
        >
            <!-- Header Section -->
            <div class="flex flex-row items-center justify-left gap-4">
                <!-- Left section: Titles -->
                <div>
                    <h1
                        class="text-3xl font-bold text-surface-900 dark:text-surface-0"
                    >
                        Billing Status
                    </h1>
                    <p class="text-surface-500 dark:text-surface-400">
                        Your subscription transaction details
                    </p>
                </div>
            </div>

            <p-card styleClass="card-panel">
                <div
                    class="flex flex-col items-center justify-center py-12 gap-6 text-center max-w-2xl mx-auto"
                >
                    @if (loading) {
                        <div
                            class="relative w-24 h-24 mx-auto flex items-center justify-center"
                        >
                            <!-- Background Ring -->
                            <div
                                class="absolute inset-0 rounded-full border-4 border-primary-500/10"
                            ></div>

                            <!-- Pulsing Glow -->
                            <div
                                class="absolute inset-0 rounded-full bg-primary-500/20 blur-xl animate-pulse"
                            ></div>

                            <!-- Custom SVG Spinner -->
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="w-16 h-16 text-primary-500 relative z-10"
                                viewBox="0 0 24 24"
                            >
                                <g stroke="currentColor" stroke-width="1.5">
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="9.5"
                                        fill="none"
                                        stroke-linecap="round"
                                        stroke-width="2.5"
                                    >
                                        <animate
                                            attributeName="stroke-dasharray"
                                            calcMode="spline"
                                            dur="0.8s"
                                            keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1"
                                            keyTimes="0;0.475;0.95;1"
                                            repeatCount="indefinite"
                                            values="0 150;60 150;60 150;60 150"
                                        />
                                        <animate
                                            attributeName="stroke-dashoffset"
                                            calcMode="spline"
                                            dur="0.8s"
                                            keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1"
                                            keyTimes="0;0.475;0.95;1"
                                            repeatCount="indefinite"
                                            values="0;-20;-75;-75"
                                        />
                                    </circle>
                                    <animateTransform
                                        attributeName="transform"
                                        dur="1.2s"
                                        repeatCount="indefinite"
                                        type="rotate"
                                        values="0 12 12;360 12 12"
                                    />
                                </g>
                            </svg>
                        </div>
                        <div class="space-y-2">
                            <h2
                                class="text-2xl font-bold text-surface-900 dark:text-surface-0"
                            >
                                Verifying your subscription...
                            </h2>
                            <p class="text-surface-500">
                                Please wait while we confirm your payment with
                                Stripe.
                            </p>
                        </div>
                    } @else if (success) {
                        <div
                            class="w-20 h-20 rounded-full bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-500"
                        >
                            <i
                                class="icon-[hugeicons--checkmark-circle-01] size-12"
                            ></i>
                        </div>
                        <div class="space-y-2">
                            <h2
                                class="text-3xl font-bold text-surface-900 dark:text-surface-0"
                            >
                                Payment Successful!
                            </h2>
                            <p
                                class="text-surface-600 dark:text-surface-400 text-lg max-w-md mx-auto"
                            >
                                Thank you for your purchase. Your subscription
                                is now active and your limits have been updated.
                            </p>
                        </div>

                        <div
                            class="flex flex-col sm:flex-row gap-3 mt-4 w-full justify-center"
                        >
                            <p-button
                                label="Back to Dashboard"
                                icon="pi pi-home"
                                routerLink="/"
                                styleClass="rounded-xl!"
                            />
                            <p-button
                                label="Manage Billing"
                                icon="pi pi-credit-card"
                                [routerLink]="['/settings']"
                                [queryParams]="{ tab: 'billing' }"
                                severity="secondary"
                                [outlined]="true"
                                styleClass="rounded-xl!"
                            />
                        </div>
                    } @else {
                        <div
                            class="w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500"
                        >
                            <i class="icon-[hugeicons--cancel-01] size-12"></i>
                        </div>
                        <div class="space-y-2">
                            <h2
                                class="text-2xl font-bold text-surface-900 dark:text-surface-0"
                            >
                                Verification Failed
                            </h2>
                            <p
                                class="text-surface-600 dark:text-surface-400 max-w-md mx-auto"
                            >
                                We couldn't verify your checkout session. This
                                might be because the payment is still being
                                processed by Stripe.
                            </p>
                        </div>

                        <div
                            class="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 flex items-start gap-3 text-left w-full max-w-md"
                        >
                            <i
                                class="pi pi-info-circle text-amber-500 mt-0.5"
                            ></i>
                            <span
                                class="text-amber-800 dark:text-amber-400 text-sm"
                            >
                                Don't worry, your subscription will activate
                                automatically once the payment is confirmed.
                            </span>
                        </div>

                        <div
                            class="flex flex-col sm:flex-row gap-3 mt-4 w-full justify-center"
                        >
                            <p-button
                                label="Try Again"
                                icon="pi pi-refresh"
                                (onClick)="verifySession()"
                                styleClass="rounded-xl!"
                            />
                            <p-button
                                label="Billing Settings"
                                icon="pi pi-cog"
                                [routerLink]="['/settings']"
                                [queryParams]="{ tab: 'billing' }"
                                severity="secondary"
                                [text]="true"
                                styleClass="rounded-xl!"
                            />
                        </div>
                    }
                </div>
            </p-card>
        </div>
    `,
})
export class BillingSuccessPage implements OnInit {
    private route = inject(ActivatedRoute);
    private settingsService = inject(SettingService);
    private subscriptionService = inject(SubscriptionService);

    loading = false;
    success = false;
    sessionId: string | null = null;

    ngOnInit() {
        const session = this.route.snapshot.data['session'];
        if (session) {
            this.success = session.success;
            this.sessionId = session.sessionId;

            if (this.success) {
                this.subscriptionService.refreshSubscription();
            }
        }
    }

    verifySession() {
        if (!this.sessionId) return;
        this.loading = true;
        this.settingsService.verifyCheckoutSession(this.sessionId).subscribe({
            next: (res) => {
                if (
                    res.success &&
                    (res.data.status === 'complete' ||
                        res.data.status === 'open')
                ) {
                    this.success = true;
                    this.subscriptionService.refreshSubscription();
                } else {
                    this.success = false;
                }
                this.loading = false;
            },
            error: () => {
                this.success = false;
                this.loading = false;
            },
        });
    }
}

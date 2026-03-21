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
        <div class="flex flex-col items-center justify-center min-h-[60vh] p-4">
            <p-card
                styleClass="max-w-lg w-full shadow-xl border-t-4 border-primary-500"
            >
                <div class="text-center py-8">
                    @if (loading) {
                        <p-progressSpinner
                            styleClass="mx-auto block"
                            strokeWidth="4"
                        ></p-progressSpinner>
                        <h2 class="text-2xl font-bold mt-6 text-slate-800">
                            Verifying your subscription...
                        </h2>
                        <p class="text-slate-500 mt-2">
                            Please wait while we confirm your payment with
                            Stripe.
                        </p>
                    } @else if (success) {
                        <div
                            class="bg-green-100 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        >
                            <i class="pi pi-check text-4xl"></i>
                        </div>
                        <h2 class="text-3xl font-bold text-slate-800">
                            Payment Successful!
                        </h2>
                        <p class="text-slate-600 mt-4 text-lg">
                            Thank you for your purchase. Your subscription is
                            now active.
                        </p>
                        <div class="mt-10 flex flex-col gap-3">
                            <button
                                pButton
                                pRipple
                                label="Go to Dashboard"
                                icon="pi pi-home"
                                routerLink="/"
                                class="p-button-lg w-full"
                            ></button>
                            <button
                                pButton
                                pRipple
                                label="Manage Billing"
                                icon="pi pi-credit-card"
                                [routerLink]="['/settings']"
                                [queryParams]="{ tab: 'billing' }"
                                class="p-button-outlined p-button-lg w-full"
                            ></button>
                        </div>
                    } @else {
                        <div
                            class="bg-red-100 text-red-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        >
                            <i class="pi pi-times text-4xl"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-slate-800">
                            Verification Failed
                        </h2>
                        <p class="text-slate-600 mt-4">
                            We couldn't verify your checkout session. This might
                            be because the payment is still being processed.
                        </p>
                        <p-message
                            severity="warn"
                            variant="outlined"
                            styleClass="mt-6 w-full"
                        >Don't worry, your subscription will be activated automatically once the payment is confirmed.</p-message>
                        <div class="mt-8 flex flex-col gap-3">
                            <button
                                pButton
                                pRipple
                                label="Try Again"
                                icon="pi pi-refresh"
                                (click)="verifySession()"
                                class="p-button-lg w-full"
                            ></button>
                            <button
                                pButton
                                pRipple
                                label="Go to Settings"
                                icon="pi pi-cog"
                                [routerLink]="['/settings']"
                                [queryParams]="{ tab: 'billing' }"
                                class="p-button-text w-full"
                            ></button>
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

    loading = true;
    success = false;
    sessionId: string | null = null;

    ngOnInit() {
        this.sessionId = this.route.snapshot.queryParamMap.get('session_id');
        if (this.sessionId) {
            this.verifySession();
        } else {
            this.loading = false;
            this.success = false;
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

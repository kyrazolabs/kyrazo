import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-billing-cancel',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, CardModule],
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
                    <div
                        class="w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600"
                    >
                        <i
                            class="icon-[hugeicons--information-circle] size-12"
                        ></i>
                    </div>

                    <div class="space-y-2">
                        <h2
                            class="text-3xl font-bold text-surface-900 dark:text-surface-0"
                        >
                            Checkout Cancelled
                        </h2>
                        <p
                            class="text-surface-600 dark:text-surface-400 text-lg max-w-md mx-auto"
                        >
                            Your payment was not completed and no charges were
                            made.
                        </p>
                        <p class="text-surface-500 text-sm italic">
                            If you experienced any issues, please feel free to
                            contact our support.
                        </p>
                    </div>

                    <div
                        class="flex flex-col sm:flex-row gap-3 mt-4 w-full justify-center"
                    >
                        <p-button
                            label="Back to Settings"
                            icon="pi pi-arrow-left"
                            [routerLink]="['/settings']"
                            [queryParams]="{ tab: 'billing' }"
                            styleClass="rounded-xl!"
                        />
                        <p-button
                            label="Go to Dashboard"
                            icon="pi pi-home"
                            routerLink="/"
                            severity="secondary"
                            [text]="true"
                            styleClass="rounded-xl!"
                        />
                    </div>
                </div>
            </p-card>
        </div>
    `,
})
export class BillingCancelPage {}

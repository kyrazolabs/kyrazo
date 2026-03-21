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
        <div class="flex flex-col items-center justify-center min-h-[60vh] p-4">
            <p-card
                styleClass="card-panel border-t-4! border-amber-500!"
            >
                <div class="text-center py-8">
                    <div
                        class="bg-amber-100 text-amber-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                        <i class="pi pi-info-circle text-4xl"></i>
                    </div>
                    <h2 class="text-3xl font-bold text-slate-800">
                        Checkout Cancelled
                    </h2>
                    <p class="text-slate-600 mt-4 text-lg">
                        Your payment was not completed and no charges were made.
                    </p>
                    <p class="text-slate-500 mt-2">
                        If you experienced any issues, please feel free to
                        contact our support.
                    </p>
                    <div class="mt-10 flex flex-col gap-3">
                        <button
                            pButton
                            pRipple
                            label="Back to Settings"
                            icon="pi pi-arrow-left"
                            [routerLink]="['/settings']"
                            [queryParams]="{ tab: 'billing' }"
                            class="p-button-lg w-full"
                        ></button>
                        <button
                            pButton
                            pRipple
                            label="Go to Dashboard"
                            icon="pi pi-home"
                            routerLink="/"
                            class="p-button-text p-button-lg w-full"
                        ></button>
                    </div>
                </div>
            </p-card>
        </div>
    `,
})
export class BillingCancelPage {}

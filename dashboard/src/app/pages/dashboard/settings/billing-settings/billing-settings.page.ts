import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { ChartModule } from 'primeng/chart';

// Services and Types
import { SettingService } from '@core/services/settings.service';
import {
    ISubscription,
    IPlan,
    BillingHistoryItem,
    UsageStats,
    BillingInfo,
    PaymentMethod,
} from '@models/billing.types';
import { SentryService } from '@core/3rd-party/sentry';
import { LoaderService } from '@core/services/loader.service';

@Component({
    selector: 'app-billing-settings',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        CardModule,
        RouterLink,
        ButtonModule,
        TagModule,
        ProgressBarModule,
        DividerModule,
        ToastModule,
        DialogModule,
        TableModule,
        SelectModule,
        ChartModule,
    ],
    templateUrl: './billing-settings.page.html',
    styleUrl: './billing-settings.page.scss',
})
export class BillingSettingsPage implements OnInit {
    private fb = inject(FormBuilder);
    private route = inject(ActivatedRoute);
    private settingsService = inject(SettingService);
    private messageService = inject(MessageService);
    private sentry = inject(SentryService);
    public loader = inject(LoaderService);

    currentSubscription: ISubscription | null = null;
    availablePlans: IPlan[] = [];
    billingHistory: BillingHistoryItem[] = [];
    usage: UsageStats | null = null;
    billing: BillingInfo | null = null;
    paymentMethod: PaymentMethod | null = null;

    upgradeForm!: FormGroup;
    isLoading = false;
    showUpgradeDialog = false;

    upgradePlanOptions: { label: string; value: string }[] = [];

    ngOnInit() {
        // 1. Initialize form first to avoid getter errors
        this.upgradeForm = this.fb.group({
            selectedPlan: [''],
        });

        // 2. Get data from resolver
        const resolvedData = this.route.snapshot.data;
        this.currentSubscription = resolvedData['subscription'] || null;

        const plansData = resolvedData['plans'];
        if (Array.isArray(plansData)) {
            this.availablePlans = plansData;
        } else if (
            plansData &&
            typeof plansData === 'object' &&
            'plans' in plansData
        ) {
            this.availablePlans = (plansData as any).plans;
        } else {
            this.availablePlans = [];
        }

        this.updateUpgradeOptions();

        // 3. Load additional data
        this.loadBillingInfo();

        if (this.currentSubscription) {
            this.loadUsageStats();
            this.loadPaymentMethod();
        }
    }

    private updateUpgradeOptions() {
        this.upgradePlanOptions = this.availablePlans.map((plan) => ({
            label: `${plan.name} - $${
                (plan.priceCents || 0) / 100
            }/${this.getFrequencyLabel(
                plan.interval || (plan as any).frequency || 'monthly',
            )}`,
            value: plan.id,
        }));
    }

    // billingHistory is now populated in loadBillingInfo
    // loadBillingHistory() ... removed

    loadUsageStats() {
        // For now, we'll use mock usage data
        // In a real implementation, you'd have a separate endpoint for usage stats
        if (this.currentSubscription?.plan) {
            this.usage = {
                webhooksUsed: Math.floor(
                    Math.random() *
                        this.currentSubscription.plan.limits.webhooks,
                ),
                endpointsUsed: Math.floor(
                    Math.random() *
                        this.currentSubscription.plan.limits.endpoints,
                ),
                deliveriesThisMonth: Math.floor(
                    Math.random() *
                        this.currentSubscription.plan.limits.deliveriesPerMonth,
                ),
                apiCallsThisMonth: Math.floor(
                    Math.random() *
                        this.currentSubscription.plan.limits.apiCallsPerMonth,
                ),
                storageUsedGB: Math.floor(
                    Math.random() *
                        this.currentSubscription.plan.limits.storageGB,
                ),
                successRate: 95 + Math.random() * 5, // 95-100%
            };
        }
    }

    loadBillingInfo() {
        this.loader.show();
        this.settingsService
            .getWorkspaceSubscriptions()
            .pipe(finalize(() => this.loader.hide()))
            .subscribe({
                next: (res) => {
                    if (res.success && res.data) {
                        const subscriptions = Array.isArray(res.data)
                            ? res.data
                            : (res.data as any).subscriptions;

                        if (!Array.isArray(subscriptions)) {
                            return;
                        }

                        // Find the active subscription
                        const activeSub = subscriptions.find((sub: any) =>
                            ['active', 'trialing', 'past_due'].includes(
                                sub.status,
                            ),
                        );

                        if (activeSub) {
                            this.currentSubscription = activeSub;
                            this.billingHistory = subscriptions.map(
                                (sub: any) => ({
                                    id: sub.id,
                                    date: sub.startDate,
                                    description: `${
                                        sub.planSnapshot?.name ||
                                        sub.plan?.name ||
                                        'Unknown Plan'
                                    } - ${this.getFrequencyLabel(
                                        sub.planSnapshot?.interval ||
                                            sub.plan?.frequency ||
                                            'monthly',
                                    )}`,
                                    amount:
                                        (sub.planSnapshot?.priceCents ||
                                            sub.plan?.priceCents ||
                                            0) / 100,
                                    status:
                                        sub.status === 'active'
                                            ? 'paid'
                                            : (sub.status as any),
                                    invoiceUrl: '', // Add if available
                                }),
                            );

                            if (activeSub.planSnapshot || activeSub.plan) {
                                const snapshot =
                                    activeSub.planSnapshot || activeSub.plan;
                                this.billing = {
                                    nextAmount:
                                        (snapshot.priceCents || 0) / 100,
                                    nextDue: activeSub.nextBillingDate || '',
                                    totalSaved: 0,
                                    currency: snapshot.currency || 'USD',
                                };
                            }

                            this.loadUsageStats(); // Reload usage if we have a sub
                            this.loadPaymentMethod(); // Reload payment method
                        } else {
                            this.currentSubscription = null;
                        }
                    }
                },
                error: (err) => {
                    this.sentry.captureException(err);
                    console.error('Failed to load subscriptions:', err);
                },
            });
    }

    loadPaymentMethod() {
        // Payment method info comes with the subscription in this model
        if (this.currentSubscription?.paymentMethod) {
            this.paymentMethod = {
                type: this.currentSubscription.paymentMethod.type,
                paypalEmail: this.currentSubscription.paymentMethod.paypalEmail,
                brand:
                    this.currentSubscription.paymentMethod.type === 'paypal'
                        ? 'PayPal'
                        : 'Card',
                last4: '****',
                isDefault: true,
            };
        }
    }

    private getFrequencyLabel(frequency: string): string {
        const labels = {
            daily: 'Daily',
            weekly: 'Weekly',
            monthly: 'Monthly',
            yearly: 'Yearly',
        };
        return labels[frequency as keyof typeof labels] || 'Monthly';
    }

    // Computed properties for template
    get currentPlanName(): string {
        return (
            this.currentSubscription?.planSnapshot?.name ||
            this.currentSubscription?.plan?.name ||
            'No Plan'
        );
    }

    get currentPlanPrice(): number {
        const priceCents =
            this.currentSubscription?.planSnapshot?.priceCents ||
            this.currentSubscription?.plan?.priceCents ||
            0;
        return priceCents / 100;
    }

    get currentPlanFrequency(): string {
        return (
            this.currentSubscription?.planSnapshot?.interval ||
            this.currentSubscription?.plan?.interval ||
            this.currentSubscription?.plan?.frequency ||
            'monthly'
        );
    }

    get currentPlanLimits(): any {
        return (
            this.currentSubscription?.planSnapshot?.limits ||
            this.currentSubscription?.plan?.limits ||
            {}
        );
    }

    get nextBillingDate(): string {
        return this.currentSubscription?.nextBillingDate || '';
    }

    get isAutoRenewEnabled(): boolean {
        return this.currentSubscription?.autoRenew || false;
    }

    get usagePercentage(): number {
        return this.getUsagePercentage();
    }

    get webhooksUsed(): number {
        return this.usage?.webhooksUsed || 0;
    }

    get webhooksLimit(): number {
        const limits = this.currentPlanLimits;
        return limits.eventsPerMonth || limits.webhooks || 0;
    }

    get nextBillAmount(): number {
        return this.billing?.nextAmount || 0;
    }

    get nextBillDue(): string {
        return this.billing?.nextDue || '';
    }

    get successRate(): number {
        return this.usage?.successRate || 0;
    }

    get totalSaved(): number {
        return this.billing?.totalSaved || 0;
    }

    get paymentMethodBrand(): string {
        return this.paymentMethod?.brand || 'Card';
    }

    get paymentMethodLast4(): string {
        return this.paymentMethod?.last4 || '****';
    }

    get paymentMethodExpMonth(): string {
        return this.paymentMethod?.expMonth || '';
    }

    get paymentMethodExpYear(): string {
        return this.paymentMethod?.expYear || '';
    }

    getUsagePercentage(): number {
        if (!this.usage) return 0;
        const limit = this.webhooksLimit;
        if (limit === 0) return 0;
        return Math.round((this.usage.webhooksUsed / limit) * 100);
    }

    get selectedPlanControl() {
        return this.upgradeForm.get('selectedPlan') as any;
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
        switch (status.toLowerCase()) {
            case 'active':
                return 'success';
            case 'inactive':
                return 'danger';
            case 'cancelled':
                return 'danger';
            case 'pending':
                return 'warn';
            default:
                return 'info';
        }
    }

    getInvoiceStatusSeverity(
        status: string,
    ): 'success' | 'info' | 'warn' | 'danger' {
        switch (status.toLowerCase()) {
            case 'paid':
                return 'success';
            case 'pending':
                return 'warn';
            case 'failed':
                return 'danger';
            case 'overdue':
                return 'danger';
            default:
                return 'info';
        }
    }

    formatDate(date: string | Date): string {
        if (!date) return '';
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    formatNumber(num: number): string {
        return num.toLocaleString();
    }

    downloadInvoice() {
        this.updatePaymentMethod();
    }

    downloadSpecificInvoice(invoiceId: string) {
        this.messageService.add({
            severity: 'success',
            summary: 'Download Started',
            detail: `Invoice ${invoiceId} is being downloaded...`,
        });
    }

    updatePaymentMethod() {
        const returnUrl = window.location.href;
        this.settingsService.createBillingPortalSession(returnUrl).subscribe({
            next: (res) => {
                if (res.data?.url) {
                    window.location.href = res.data.url;
                }
            },
            error: (err) => {
                this.sentry.captureException(err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Could not redirect to billing portal',
                });
            },
        });
    }

    selectPlan(plan: IPlan) {
        if (
            this.currentSubscription &&
            this.currentSubscription.plan?.id === plan.id
        )
            return;

        if (!this.currentSubscription) {
            // New Subscription Flow
            const request = { planId: plan.id };
            this.loader.show();
            this.settingsService
                .createSubscriptionPayment(request)
                .pipe(finalize(() => this.loader.hide()))
                .subscribe({
                    next: (response) => {
                        if (response.success) {
                            const data = response.data as any;
                            if (data.hostedInvoiceUrl) {
                                this.messageService.add({
                                    severity: 'info',
                                    summary: 'Redirecting',
                                    detail: 'Taking you to the payment page...',
                                });
                                setTimeout(() => {
                                    window.location.href =
                                        data.hostedInvoiceUrl;
                                }, 1500);
                            } else {
                                this.messageService.add({
                                    severity: 'success',
                                    summary: 'Success',
                                    detail: 'Subscription created successfully.',
                                });
                                this.loadBillingInfo();
                            }
                        }
                    },
                    error: (err) => {
                        this.sentry.captureException(err);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to create subscription.',
                        });
                    },
                });
            return;
        }

        // Existing Subscription -> Change Plan
        this.confirmUpgrade(plan);
    }

    confirmUpgrade(plan?: IPlan) {
        const selectedPlanId = plan?.id || this.upgradeForm.value.selectedPlan;

        if (!selectedPlanId) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Selection Required',
                detail: 'Please select a plan to upgrade to.',
            });
            return;
        }

        if (!this.currentSubscription) return;

        this.loader.show();
        this.settingsService
            .changePlan(this.currentSubscription.id, selectedPlanId)
            .pipe(finalize(() => this.loader.hide()))
            .subscribe({
                next: (res) => {
                    const data = res.data as any;
                    if (data.paymentUrl || data.hostedInvoiceUrl) {
                        this.messageService.add({
                            severity: 'info',
                            summary: 'Payment Required',
                            detail: 'Redirecting to payment page...',
                        });
                        this.showUpgradeDialog = false;
                        setTimeout(() => {
                            window.location.href =
                                data.paymentUrl || data.hostedInvoiceUrl;
                        }, 1500);
                    } else {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: `Plan changed successfully`,
                        });
                        this.showUpgradeDialog = false;
                        this.loadBillingInfo(); // Reload subscription
                    }
                },
                error: (err) => {
                    this.sentry.captureException(err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to change plan',
                    });
                },
            });
    }
}

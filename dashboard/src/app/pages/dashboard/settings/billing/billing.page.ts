import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { finalize } from 'rxjs';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { DialogService } from '@shared/services/dialog.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TextareaModule } from 'primeng/textarea';
import { RadioButtonModule } from 'primeng/radiobutton';

// Services and Types
import { SettingService } from '@core/services/settings.service';
import {
    ISubscription,
    IPlan,
    UsageStats,
    BillingInfo,
} from '@models/billing.types';
import { SentryService } from '@core/3rd-party/sentry';
import { LoaderService } from '@core/services/loader.service';
import { SupportService } from '@core/services/support.service';
import { SubscriptionService } from '@core/services/subscription.service';

import { ProfileSettingsPage } from '../profile/profile.page';
import { PricingPlan, MANUAL_CUSTOM_PLAN } from './pricing.model';
import { PricingCardComponent } from './components/card/pricing-card.component';
import { PricingComparisonComponent } from './components/comparison/pricing-comparison.component';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';

@Component({
    selector: 'app-billing-settings',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        CardModule,
        ButtonModule,
        TagModule,
        ProgressBarModule,
        DividerModule,
        DialogModule,
        TableModule,
        SelectModule,
        TooltipModule,
        ConfirmDialogModule,
        TextareaModule,
        RadioButtonModule,
        MessageModule,
        PricingCardComponent,
        PricingComparisonComponent,
    ],
    templateUrl: './billing.page.html',
    styleUrl: './billing.page.scss',
})
export class BillingSettingsPage implements OnInit {
    private fb = inject(FormBuilder);
    private settingsService = inject(SettingService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private sentry = inject(SentryService);
    private supportService = inject(SupportService);
    private dialogService = inject(DialogService);
    public loader = inject(LoaderService);
    public subscriptionService = inject(SubscriptionService);

    currentSubscription: ISubscription | null = null;
    availablePlans: IPlan[] = [];
    filteredPlans: IPlan[] = [];
    usage: UsageStats | null = null;
    billing: BillingInfo | null = null;

    billingCycle = signal<'month'>('month');
    isRedirectingToPortal = false;

    // Premium UI Signals
    hasInteracted = signal(false);
    shakeToggle = signal(false);
    lightningOffset = signal(0);
    plans = signal<PricingPlan[]>([]);


    get isFirstMonth(): boolean {
        if (!this.currentSubscription?.startDate) return false;
        const startDate = new Date(this.currentSubscription.startDate);
        const now = new Date();
        if (startDate > now) return false;

        const diffTime = now.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
    }

    upgradeForm!: FormGroup;
    showUpgradeDialog = false;
    upgradePlanOptions: { label: string; value: string }[] = [];

    // Cancellation Flow
    cancelForm!: FormGroup;
    showCancelDialog = false;
    cancellationStage: 'confirm' | 'feedback' | 'final' = 'confirm';
    cancelReasons = [
        { label: 'Too expensive', value: 'expensive' },
        { label: 'Missing features', value: 'missing_features' },
        { label: 'Difficult to use', value: 'difficult' },
        { label: 'Found better alternative', value: 'alternative' },
        { label: 'No longer need it', value: 'not_needed' },
        { label: 'Other', value: 'other' },
    ];

    ngOnInit() {
        this.upgradeForm = this.fb.group({
            selectedPlan: [''],
        });

        this.cancelForm = this.fb.group({
            reason: [''],
            comment: [''],
        });

        this.loadInitialData();
    }

    private loadInitialData() {
        // Fetch plans
        this.settingsService.getPlans().subscribe({
            next: (res) => {
                this.availablePlans = res.data || [];
                this.plans.set(this.groupPlans(this.availablePlans));
                this.updateUpgradeOptions();
            },
        });

        // Fetch subscriptions and usage
        this.loadBillingInfo();
    }

    private groupPlans(allPlans: any[]): PricingPlan[] {
        const grouped = new Map<string, PricingPlan>();

        const normalizeSlug = (slug: string) =>
            slug.replace(/y$/, '').replace(/ly$/, '').toLowerCase();

        const isYearly = (p: any) =>
            p.interval?.startsWith('year') ||
            p.slug?.endsWith('y') ||
            p.slug?.endsWith('ly') ||
            (p.priceCents || 0) > 50000;

        allPlans.forEach((plan: any) => {
            const groupKey = normalizeSlug(plan.slug || '');
            const existing = grouped.get(groupKey);
            const planIsYearly = isYearly(plan);

            if (existing) {
                // We only care about monthly prices now
                if (!planIsYearly) {
                    existing.priceCentsMonthly = plan.priceCents;
                    if (existing.stripePriceId) {
                        existing.stripePriceId.monthly = plan.stripePriceId;
                    }
                }
            } else {
                if (planIsYearly) return; // Skip yearly plans in grouping

                const pricingPlan: PricingPlan = {
                    id: plan.id,
                    originalPlan: plan,
                    name: plan.name || '',
                    slug: groupKey,
                    description: plan.description || '',
                    priceCentsMonthly: plan.priceCents,
                    priceCentsYearly: plan.priceCents * 12, // legacy/display internal
                    currency: plan.currency || 'EUR',
                    features: plan.features || {},
                    limits: plan.limits || {},
                    benefits: plan.benefits || [],
                    stripePriceId: {
                        monthly: plan.stripePriceId,
                        yearly: '',
                    },
                    overagePriceCents: plan.overagePriceCents || 0,
                    meterId: plan.stripeMeterId || '',
                    isActive: plan.isActive ?? true,
                };
                grouped.set(groupKey, pricingPlan);
            }
        });

        const result = Array.from(grouped.values()).sort(
            (a, b) => a.priceCentsMonthly - b.priceCentsMonthly,
        );

        // Add manual custom plan if not already there
        if (!result.find((p) => p.slug === 'custom')) {
            result.push(MANUAL_CUSTOM_PLAN);
        }

        return result;
    }

    // Toggle cycle removed as only monthly is supported

    openFullComparison() {
        window.open('https://kyrazo.com/pricing', '_blank');
    }

    selectPlanFromCard(plan: PricingPlan) {
        if (plan.slug === 'custom' || plan.slug === 'enterprise') {
            window.location.href = 'mailto:sales@kyrazo.com';
            return;
        }

        if (plan.slug === 'free') {
            this.cancelSubscription();
            return;
        }

        // Logic to find the specific backend plan (IPlan) based on interval
        const targetPlan = this.availablePlans.find((p) => {
            const matchesSlug = (p.slug || '')
                .toLowerCase()
                .startsWith(plan.slug.toLowerCase());
            const matchesInterval = (
                p.interval ||
                (p as any).frequency ||
                'month'
            ).includes('month');
            return matchesSlug && matchesInterval;
        });

        if (targetPlan) {
            this.selectPlan(targetPlan);
        } else {
            // Fallback to the original plan if interval matching fails but we have a reference
            const fallback =
                plan.originalPlan ||
                this.availablePlans.find((p) => p.slug?.startsWith(plan.slug));
            if (fallback) this.selectPlan(fallback);
        }
    }

    private updateUpgradeOptions() {
        this.filteredPlans = this.availablePlans
            .filter((plan) => {
                const isNotFree = plan.slug !== 'free';
                const matchesInterval = (
                    plan.interval ||
                    (plan as any).frequency ||
                    'month'
                ).includes('month');
                return isNotFree && matchesInterval;
            })
            .sort((a, b) => (a.priceCents || 0) - (b.priceCents || 0));

        this.upgradePlanOptions = this.filteredPlans
            .filter((plan) => plan.id !== this.currentSubscription?.planId)
            .map((plan) => ({
                label: `${plan.name} - $${(plan.priceCents || 0) / 100}/${this.getFrequencyLabel(plan.interval || (plan as any).frequency || 'monthly')}`,
                value: plan.id,
            }));
    }

    setBillingCycle(cycle: 'month') {
        this.billingCycle.set(cycle);
        this.updateUpgradeOptions();
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
                        if (!Array.isArray(subscriptions)) return;

                        const activeSub = subscriptions.find((sub: any) =>
                            ['active', 'trialing', 'past_due'].includes(
                                sub.status,
                            ),
                        );

                        if (activeSub) {
                            this.currentSubscription = activeSub;
                            const interval =
                                activeSub.planSnapshot?.interval ||
                                activeSub.plan?.interval;
                            if (interval === 'month' || interval === 'year') {
                                this.billingCycle.set('month');
                            }
                            this.loadUsageStats();
                        } else {
                            this.currentSubscription = null;
                        }
                        this.updateUpgradeOptions();
                    }
                },
                error: (err) => {
                    this.sentry.captureException(err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load billing info',
                    });
                },
            });
    }

    loadUsageStats() {
        if (this.currentSubscription?.plan) {
            // Mock usage for core metrics as requested (simplified)
            const webhooksLimit =
                this.currentSubscription.plan.limits.eventsPerMonth ||
                this.currentSubscription.plan.limits.webhooks ||
                1000;
            this.usage = {
                webhooksUsed: Math.floor(Math.random() * webhooksLimit),
                successRate: 0,
                totalSaved: 0,
            } as any;
        }
    }

    private getFrequencyLabel(frequency: string): string {
        const labels = {
            daily: 'Daily',
            weekly: 'Weekly',
            monthly: 'Monthly',
            yearly: 'Yearly',
            month: 'Month',
            year: 'Year',
        };
        return labels[frequency as keyof typeof labels] || 'Month';
    }

    get currentPlanName(): string {
        return (
            this.currentSubscription?.planSnapshot?.name ||
            this.currentSubscription?.plan?.name ||
            'No Plan'
        );
    }
    get currentPlanSlug(): string {
        return (
            this.currentSubscription?.planSnapshot?.slug ||
            this.currentSubscription?.plan?.slug ||
            ''
        );
    }
    get currentPlanPrice(): number {
        return (
            (this.currentSubscription?.planSnapshot?.priceCents ||
                this.currentSubscription?.plan?.priceCents ||
                0) / 100
        );
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
    get webhooksLimit(): number {
        const limits = this.currentPlanLimits;
        return limits.eventsPerMonth || limits.webhooks || 0;
    }
    get webhooksUsed(): number {
        return this.usage?.webhooksUsed || 0;
    }

    getUsagePercentage(): number {
        if (!this.usage || !this.webhooksLimit) return 0;
        return Math.round((this.usage.webhooksUsed / this.webhooksLimit) * 100);
    }

    getPlanFeatures(plan: any): string[] {
        const features = plan?.features;
        if (!features) return [];
        if (Array.isArray(features)) return features;
        if (typeof features === 'object') return Object.keys(features);
        return [];
    }

    get selectedPlanControl() {
        return this.upgradeForm.get('selectedPlan') as any;
    }

    getStatusSeverity(status: string) {
        switch (status?.toLowerCase()) {
            case 'active':
            case 'paid':
                return 'bg-primary-500/10 border border-primary-500/30 text-primary-600 shadow-primary-500/20';
            case 'pending':
                return 'bg-amber-500/10 border border-amber-500/30 text-amber-600 shadow-amber-500/20';
            case 'inactive':
            case 'cancelled':
                return 'bg-red-500/10 border border-red-500/30 text-red-600 shadow-red-500/20';
            default:
                return 'bg-sky-500/10 border border-sky-500/30 text-sky-600 shadow-sky-500/20';
        }
    }

    formatDate(date: string | Date): string {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    updatePaymentMethod() {
        const returnUrl = window.location.href;
        this.isRedirectingToPortal = true;
        this.settingsService
            .createBillingPortalSession(returnUrl)
            .pipe(finalize(() => (this.isRedirectingToPortal = false)))
            .subscribe({
                next: (res) => {
                    if (res.data?.url) window.open(res.data.url, '_blank');
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
            (this.currentSubscription.plan?.id === plan.id ||
                this.currentSubscription.planId === plan.id)
        )
            return;

        // If no active subscription OR it's a "virtual" free plan OR it lacks a Stripe ID (initial free),
        // treat as a new subscription (Checkout)
        const isNewSubscription =
            !this.currentSubscription ||
            this.currentSubscription.isVirtual ||
            !this.currentSubscription.stripeSubscriptionId;

        if (isNewSubscription) {
            this.loader.show();
            this.settingsService
                .createSubscriptionPayment({ planId: plan.id })
                .pipe(finalize(() => this.loader.hide()))
                .subscribe({
                    next: (res) => {
                        const data = res.data as any;
                        if (data?.checkoutUrl || data?.hostedInvoiceUrl)
                            window.open(
                                data.checkoutUrl || data.hostedInvoiceUrl,
                                '_blank',
                            );
                        else {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Success',
                                detail: 'Subscription created',
                            });
                            this.showUpgradeDialog = false;
                            this.loadBillingInfo();
                        }
                    },
                    error: (err) => {
                        this.sentry.captureException(err);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to create subscription',
                        });
                    },
                });
            return;
        }

        this.confirmUpgrade(plan);
    }

    confirmUpgrade(plan?: IPlan) {
        const selectedPlanId = plan?.id || this.upgradeForm.value.selectedPlan;
        if (!selectedPlanId) return;

        // Same check as selectPlan: if unlinked, treat as new
        const isNewSubscription =
            !this.currentSubscription ||
            this.currentSubscription.isVirtual ||
            !this.currentSubscription.stripeSubscriptionId;

        if (isNewSubscription) {
            const selectedPlan =
                plan ||
                this.availablePlans.find((p) => p.id === selectedPlanId);
            if (selectedPlan) {
                this.selectPlan(selectedPlan);
            } else {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Please select a valid plan',
                });
            }
            return;
        }

        this.loader.show();
        this.settingsService
            .changePlan(this.currentSubscription!.id, selectedPlanId)
            .pipe(finalize(() => this.loader.hide()))
            .subscribe({
                next: (res) => {
                    const data = res.data as any;
                    if (data?.paymentUrl || data?.hostedInvoiceUrl) {
                        window.open(
                            data.paymentUrl || data.hostedInvoiceUrl,
                            '_blank',
                        );
                    } else {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Plan changed',
                        });
                        this.showUpgradeDialog = false;
                        this.loadBillingInfo();
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

    cancelSubscription() {
        if (!this.currentSubscription) return;
        this.cancellationStage = 'confirm';
        this.showCancelDialog = true;
    }

    nextCancellationStep() {
        if (this.cancellationStage === 'confirm') {
            this.cancellationStage = 'feedback';
        } else if (this.cancellationStage === 'feedback') {
            this.cancellationStage = 'final';
        }
    }

    prevCancellationStep() {
        if (this.cancellationStage === 'feedback') {
            this.cancellationStage = 'confirm';
        } else if (this.cancellationStage === 'final') {
            this.cancellationStage = 'feedback';
        }
    }

    confirmCancellation() {
        if (!this.currentSubscription) return;

        this.loader.show();

        // 1. Submit Feedback if any
        const feedback = this.cancelForm.value;
        if (feedback.reason || feedback.comment) {
            this.supportService
                .createTicket({
                    subject: 'Cancellation Feedback',
                    message: `Reason: ${this.cancelReasons.find((r) => r.value === feedback.reason)?.label || 'None'}\nComment: ${feedback.comment || 'None'}`,
                    Types: 'Billing' as any,
                    Category: 'Usage Limits', // Fallback category
                    kind: 'cancellation' as any,
                } as any)
                .subscribe({
                    error: (err) => this.sentry.captureException(err),
                });
        }

        // 2. Perform actual cancellation
        this.settingsService
            .cancelSubscription(this.currentSubscription.id, feedback.reason)
            .pipe(finalize(() => this.loader.hide()))
            .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Cancelled',
                        detail: 'Your subscription has been cancelled.',
                    });
                    this.showCancelDialog = false;
                    this.loadBillingInfo();
                },
                error: (err) => {
                    this.sentry.captureException(err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to cancel subscription',
                    });
                },
            });
    }

    openSupportDialog() {
        this.dialogService.openSupportDialog();
    }
}

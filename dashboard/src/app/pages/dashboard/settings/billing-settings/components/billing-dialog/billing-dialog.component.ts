import {
    Component,
    OnInit,
    inject,
    Input,
    Output,
    EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { finalize } from 'rxjs';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

// Services and Types
import { SettingService } from '@core/services/settings.service';
import {
    ISubscription,
    IPlan,
    BillingHistoryItem,
    UsageStats,
    BillingInfo,
} from '@models/billing.types';
import { SentryService } from '@core/3rd-party/sentry';
import { LoaderService } from '@core/services/loader.service';
import { DialogService } from '@shared/services/dialog.service';

@Component({
    selector: 'app-billing-dialog',
    standalone: true,
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
    ],
    templateUrl: './billing-dialog.component.html',
})
export class BillingDialogComponent implements OnInit {
    private fb = inject(FormBuilder);
    private settingsService = inject(SettingService);
    private messageService = inject(MessageService);
    private sentry = inject(SentryService);
    private dialogService = inject(DialogService);
    public loader = inject(LoaderService);

    @Input() visible = false;
    @Output() onClose = new EventEmitter<void>();

    currentSubscription: ISubscription | null = null;
    availablePlans: IPlan[] = [];
    billingHistory: BillingHistoryItem[] = [];
    usage: UsageStats | null = null;
    billing: BillingInfo | null = null;

    upgradeForm!: FormGroup;
    showUpgradeDialog = false;
    upgradePlanOptions: { label: string; value: string }[] = [];

    ngOnInit() {
        this.upgradeForm = this.fb.group({
            selectedPlan: [''],
        });

        this.loadInitialData();
    }

    private loadInitialData() {
        // Fetch plans
        this.settingsService.getPlans().subscribe({
            next: (res) => {
                this.availablePlans = res.data || [];
                this.updateUpgradeOptions();
            },
        });

        // Fetch subscriptions and usage
        this.loadBillingInfo();
    }

    private updateUpgradeOptions() {
        this.upgradePlanOptions = this.availablePlans.map((plan) => ({
            label: `${plan.name} - $${(plan.priceCents || 0) / 100}/${this.getFrequencyLabel(plan.interval || (plan as any).frequency || 'monthly')}`,
            value: plan.id,
        }));
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
                            this.billingHistory = subscriptions.map(
                                (sub: any) => ({
                                    id: sub.id,
                                    date: sub.startDate,
                                    description: `${sub.planSnapshot?.name || sub.plan?.name || 'Unknown Plan'}`,
                                    amount:
                                        (sub.planSnapshot?.priceCents ||
                                            sub.plan?.priceCents ||
                                            0) / 100,
                                    status:
                                        sub.status === 'active'
                                            ? 'paid'
                                            : (sub.status as any),
                                }),
                            );

                            this.loadUsageStats();
                        } else {
                            this.currentSubscription = null;
                        }
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
                successRate: 0, // Not requested anymore
                totalSaved: 0, // Not requested anymore
            } as any;
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

    get currentPlanName(): string {
        return (
            this.currentSubscription?.planSnapshot?.name ||
            this.currentSubscription?.plan?.name ||
            'No Plan'
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

    getPlanFeatures(plan: IPlan): string[] {
        if (!plan?.features || typeof plan.features !== 'object') return [];
        return Object.keys(plan.features);
    }

    get selectedPlanControl() {
        return this.upgradeForm.get('selectedPlan') as any;
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'success';
            case 'pending':
                return 'warn';
            case 'inactive':
            case 'cancelled':
                return 'danger';
            default:
                return 'info';
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
        this.settingsService.createBillingPortalSession(returnUrl).subscribe({
            next: (res) => {
                if (res.data?.url) window.location.href = res.data.url;
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
            this.loader.show();
            this.settingsService
                .createSubscriptionPayment({ planId: plan.id })
                .pipe(finalize(() => this.loader.hide()))
                .subscribe({
                    next: (res) => {
                        const data = res.data as any;
                        if (data?.hostedInvoiceUrl)
                            window.location.href = data.hostedInvoiceUrl;
                        else {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Success',
                                detail: 'Subscription created',
                            });
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
        if (!selectedPlanId || !this.currentSubscription) return;

        this.loader.show();
        this.settingsService
            .changePlan(this.currentSubscription.id, selectedPlanId)
            .pipe(finalize(() => this.loader.hide()))
            .subscribe({
                next: (res) => {
                    const data = res.data as any;
                    if (data?.paymentUrl || data?.hostedInvoiceUrl) {
                        window.location.href =
                            data.paymentUrl || data.hostedInvoiceUrl;
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

    hide() {
        this.onClose.emit();
    }
}

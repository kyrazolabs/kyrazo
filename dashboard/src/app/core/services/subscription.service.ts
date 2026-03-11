import { Injectable, inject, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { SettingService } from './settings.service';
import {
    ISubscription,
    IPlanFeatures,
    IPlanLimits,
} from '@models/billing.types';
import { filter, map } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class SubscriptionService {
    private storage = inject(StorageService);
    private settings = inject(SettingService);

    private _subscription = signal<ISubscription | null>(null);
    public subscription = this._subscription.asReadonly();

    public hasFeature = (featureKey: keyof IPlanFeatures) =>
        computed(() => {
            const sub = this._subscription();
            return !!sub?.planSnapshot?.features?.[featureKey];
        });

    public getLimit = (limitKey: keyof IPlanLimits) =>
        computed(() => {
            const sub = this._subscription();
            return sub?.planSnapshot?.limits?.[limitKey] ?? 0;
        });

    public isPlan = (planSlug: string) =>
        computed(() => {
            const sub = this._subscription();
            return sub?.planSnapshot?.slug === planSlug;
        });

    constructor() {
        // Initial load
        this.refreshSubscription();

        // Listen for workspace changes
        this.storage.changes$
            .pipe(
                filter(
                    (change) => change?.key === 'workspace' && change?.value,
                ),
                map((change) => change.value),
            )
            .subscribe(() => {
                this.refreshSubscription();
            });
    }

    public refreshSubscription() {
        const workspaceId = this.storage.getItem<string>('workspace');
        if (!workspaceId) {
            this._subscription.set(null);
            return;
        }

        this.settings.getWorkspaceSubscriptions().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    const activeSub = res.data.find((sub) =>
                        ['active', 'trialing', 'past_due'].includes(sub.status),
                    );
                    this._subscription.set(activeSub || null);
                } else {
                    this._subscription.set(null);
                }
            },
            error: () => {
                this._subscription.set(null);
            },
        });
    }
}

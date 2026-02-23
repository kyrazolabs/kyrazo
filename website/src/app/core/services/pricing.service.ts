import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of } from 'rxjs';
import { environment } from 'environments/environment';
import { PricingPlan } from '../../pages/pricing/pricing.model';

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

@Injectable({
    providedIn: 'root',
})
export class PricingService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.baseUrl}/v1/plans`;

    getPlans(): Observable<PricingPlan[]> {
        return this.http.get<ApiResponse<any[]>>(this.apiUrl).pipe(
            map((response) => {
                if (!response.success) return [];
                const allPlans = response.data;

                // Group by normalized slug to merge monthly and yearly prices
                const grouped = new Map<string, PricingPlan>();

                const normalizeSlug = (slug: string) =>
                    slug.replace(/y$/, '').replace(/ly$/, '').toLowerCase();
                const isYearly = (p: any) =>
                    p.interval?.startsWith('year') ||
                    p.slug.endsWith('y') ||
                    p.slug.endsWith('ly') ||
                    p.priceCents > 50000; // heuristic for yearly

                allPlans.forEach((plan: any) => {
                    const groupKey = normalizeSlug(plan.slug);
                    const existing = grouped.get(groupKey);
                    const planIsYearly = isYearly(plan);

                    if (existing) {
                        if (planIsYearly) {
                            existing.priceCentsYearly = plan.priceCents;
                            if (existing.stripePriceId) {
                                existing.stripePriceId.yearly =
                                    plan.stripePriceId;
                            }
                        } else {
                            existing.priceCentsMonthly = plan.priceCents;
                            if (existing.stripePriceId) {
                                existing.stripePriceId.monthly =
                                    plan.stripePriceId;
                            }
                        }
                    } else {
                        const pricingPlan: PricingPlan = {
                            name: plan.name
                                .replace(/y$/, '')
                                .replace(/ly$/, ''), // Clean name too
                            slug: groupKey,
                            description: plan.description,
                            priceCentsMonthly: !planIsYearly
                                ? plan.priceCents
                                : 0,
                            priceCentsYearly: planIsYearly
                                ? plan.priceCents
                                : 0,
                            currency: plan.currency,
                            features: plan.features,
                            limits: plan.limits,
                            benefits: plan.benefits || [],
                            stripePriceId: {
                                monthly: !planIsYearly
                                    ? plan.stripePriceId
                                    : '',
                                yearly: planIsYearly ? plan.stripePriceId : '',
                            },
                            overagePriceCents: plan.overagePriceCents || 0,
                            meterId: plan.stripeMeterId || '',
                            isActive: plan.isActive,
                        };
                        grouped.set(groupKey, pricingPlan);
                    }
                });

                return Array.from(grouped.values()).sort(
                    (a, b) => a.priceCentsMonthly - b.priceCentsMonthly,
                );
            }),
        );
    }
}

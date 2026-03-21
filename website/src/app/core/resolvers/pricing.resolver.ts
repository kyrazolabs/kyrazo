import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { PricingPlan } from '../../pages/pricing/pricing.model';
import { PricingService } from '../services/pricing.service';

export const pricingResolver: ResolveFn<PricingPlan[]> = (route, state) => {
    const pricingService = inject(PricingService);
    return pricingService.getPlans();
};

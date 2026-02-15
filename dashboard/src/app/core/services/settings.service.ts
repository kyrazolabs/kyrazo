import { Injectable, inject } from '@angular/core';
import {
    HttpClient,
    HttpErrorResponse,
    HttpParams,
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import {
    INotification,
    IUserPreference,
    UserProfileResponse,
} from '@models/auth.types';
import {
    IPlan,
    ISubscription,
    SubscriptionResponse,
    CreateSubscriptionRequest,
    UsageStats,
    BillingInfo,
    PaymentMethod,
} from '@models/billing.types';
import { environment } from 'environments/environment';
import { ApiResponse } from '@models/index';

@Injectable({
    providedIn: 'root',
})
export class SettingService {
    private readonly http = inject(HttpClient);

    get(): Observable<ApiResponse<UserProfileResponse>> {
        return this.http
            .get<ApiResponse<UserProfileResponse>>(environment.profile.get)
            .pipe(catchError(this.handleError));
    }

    update(
        profileData: Partial<UserProfileResponse>,
    ): Observable<ApiResponse<UserProfileResponse>> {
        return this.http
            .patch<
                ApiResponse<UserProfileResponse>
            >(environment.profile.update, profileData)
            .pipe(catchError(this.handleError));
    }

    getPreferences(): Observable<ApiResponse<IUserPreference>> {
        return this.http
            .get<
                ApiResponse<IUserPreference>
            >(environment.profile.preference.get)
            .pipe(catchError(this.handleError));
    }

    updatePreferences(
        preferencesData: Partial<IUserPreference>,
    ): Observable<ApiResponse<IUserPreference>> {
        return this.http
            .patch<
                ApiResponse<IUserPreference>
            >(environment.profile.preference.update, preferencesData)
            .pipe(catchError(this.handleError));
    }

    // Subscription methods
    getWorkspaceSubscriptions(): Observable<ApiResponse<ISubscription[]>> {
        return this.http
            .get<ApiResponse<ISubscription[]>>(environment.subscription.base)
            .pipe(catchError(this.handleError));
    }

    createSubscriptionPayment(
        subscriptionData: CreateSubscriptionRequest,
    ): Observable<ApiResponse<SubscriptionResponse>> {
        return this.http
            .post<
                ApiResponse<SubscriptionResponse>
            >(environment.subscription.base, subscriptionData)
            .pipe(catchError(this.handleError));
    }

    updateSubscription(
        subscriptionId: string,
        updateData: any,
    ): Observable<ApiResponse<ISubscription>> {
        return this.http
            .put<
                ApiResponse<ISubscription>
            >(`${environment.subscription.base}/${subscriptionId}`, updateData)
            .pipe(catchError(this.handleError));
    }

    cancelSubscription(
        subscriptionId: string,
        reason?: string,
    ): Observable<ApiResponse<ISubscription>> {
        const body = reason ? { reason } : {};
        return this.http
            .post<
                ApiResponse<ISubscription>
            >(`${environment.subscription.base}/${subscriptionId}/cancel`, body)
            .pipe(catchError(this.handleError));
    }

    changePlan(
        subscriptionId: string,
        planId: string,
    ): Observable<ApiResponse<ISubscription>> {
        return this.http
            .post<
                ApiResponse<ISubscription>
            >(environment.subscription.changePlan(subscriptionId), { planId })
            .pipe(catchError(this.handleError));
    }

    createBillingPortalSession(
        returnUrl: string,
    ): Observable<ApiResponse<{ url: string }>> {
        return this.http
            .post<ApiResponse<{ url: string }>>(environment.payment.portal, {
                returnUrl,
            })
            .pipe(catchError(this.handleError));
    }

    getPlans(): Observable<ApiResponse<IPlan[]>> {
        return this.http
            .get<ApiResponse<IPlan[]>>(environment.subscription.plans)
            .pipe(catchError(this.handleError));
    }

    private handleError(error: HttpErrorResponse): Observable<never> {
        console.error('SettingService Error:', error);
        return throwError(() => error);
    }
}

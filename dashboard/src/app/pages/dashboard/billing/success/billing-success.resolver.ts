import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { SettingService } from '@core/services/settings.service';
import { catchError, of, map } from 'rxjs';

export const billingSuccessResolver: ResolveFn<any> = (route) => {
    const sessionId = route.queryParamMap.get('session_id');
    const settingsService = inject(SettingService);

    if (!sessionId) {
        return of({ success: false, error: 'No session ID found' });
    }

    return settingsService.verifyCheckoutSession(sessionId).pipe(
        map(res => ({
            success: res.success && (res.data.status === 'complete' || res.data.status === 'open'),
            data: res.data,
            sessionId
        })),
        catchError((error) => {
            return of({ success: false, error, sessionId });
        })
    );
};

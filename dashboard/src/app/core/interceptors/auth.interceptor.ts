import {
    HttpInterceptorFn,
    HttpErrorResponse,
    HttpRequest,
    HttpHandlerFn,
    HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, Observable, throwError, from } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { OtpService } from '../services/otp.service';
import { ApiResponse } from '@models/index';
import { RefreshTokenResponse } from '@models/auth.types';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
    req: HttpRequest<any>,
    next: HttpHandlerFn,
): Observable<HttpEvent<any>> => {
    const authService = inject(AuthService);
    const otpService = inject(OtpService);

    // استثناء طلبات auth
    if (isAuthRequest(req)) {
        return next(req);
    }

    const authToken = authService.getToken();
    if (authToken) {
        req = addToken(req, authToken);
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            const code = error.error?.error?.code;

            if (error.status === 401 && code === 'TOKEN_EXPIRED') {
                return handle401Error(req, next, authService);
            }

            if (error.status === 403 && code === 'OTP_REQUIRED') {
                const action = error.error?.error?.details?.action;
                const method = error.error?.error?.details?.method;
                return from(
                    otpService.showOtpDialog(
                        action,
                        'Verification Required',
                        method,
                    ),
                ).pipe(
                    switchMap((verified) => {
                        if (verified) {
                            return next(req);
                        }
                        return throwError(() => error);
                    }),
                );
            }

            return throwError(() => error);
        }),
    );
};

// ──────────────
// 🔹 helpers
// ──────────────
function isAuthRequest(req: HttpRequest<any>): boolean {
    return (
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register') ||
        req.url.includes('/auth/refresh')
    );
}

function addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
    });
}

function handle401Error(
    req: HttpRequest<any>,
    next: HttpHandlerFn,
    authService: AuthService,
): Observable<HttpEvent<any>> {
    if (!isRefreshing) {
        isRefreshing = true;
        refreshTokenSubject.next(null);

        return authService.refreshToken(authService.getRToken()!).pipe(
            switchMap((authResponse: ApiResponse<RefreshTokenResponse>) => {
                isRefreshing = false;
                const newAccessToken = authResponse.data.tokens.access;

                authService.handleRefreshSuccess(authResponse);
                refreshTokenSubject.next(newAccessToken);
                return next(addToken(req, newAccessToken));
            }),

            catchError((error: any) => {
                isRefreshing = false;
                return throwError(() => error);
            }),
        );
    } else {
        return refreshTokenSubject.pipe(
            filter((token) => token !== null),
            take(1),
            switchMap((token) => next(addToken(req, token!))),
        );
    }
}

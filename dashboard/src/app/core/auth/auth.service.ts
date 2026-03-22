import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';

import { StorageService } from '@core/services/storage.service';
import { PostHogService } from '@core/3rd-party/posthog';

import {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    RefreshTokenResponse,
    ForgetPasswordRequest,
    ChangePasswordRequest,
    VerifyEmailRequest,
    ResetPasswordRequest,
    Login2FARequest,
    Setup2FARequest,
    Setup2FAResponse,
    Verify2FASetupRequest,
    RequestSensitiveOTPRequest,
    VerifySensitiveOTPRequest,
} from '@models/auth.types';
import { environment } from 'environments/environment';
import { ApiResponse } from '@models/index';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly storage = inject(StorageService);
    private readonly posthog = inject(PostHogService);
    
    currentUser = signal<any>(null);

    constructor() {
        this.initializeUserFromStorage();
    }

    private initializeUserFromStorage() {
        if (this.storage.hasItem('user_id')) {
            this.currentUser.set({
                id: this.storage.getItem('user_id'),
                avatar: this.storage.getItem('avatar'),
                workspaceId: this.storage.getItem('workspace'),
                fullName: this.storage.getItem('user_name'),
            });
        }
    }

    login(credentials: LoginRequest): Observable<LoginResponse> {
        return this.http
            .post<LoginResponse>(environment.auth.login, credentials)
            .pipe(tap((res) => this.handleAuthSuccess(res)));
    }

    register(payload: RegisterRequest): Observable<RegisterResponse> {
        return this.http
            .post<RegisterResponse>(environment.auth.register, payload)
            .pipe(tap((res) => this.handleAuthSuccess(res)));
    }

    onGoogleResponse(token: string): Observable<LoginResponse> {
        return this.http
            .post<LoginResponse>(environment.auth.googleLogin, { token })
            .pipe(tap((res) => this.handleAuthSuccess(res)));
    }

    onGoogleCode(code: string): Observable<LoginResponse> {
        return this.http
            .post<LoginResponse>(environment.auth.googleLogin, { code })
            .pipe(tap((res) => this.handleAuthSuccess(res)));
    }

    login2FA(payload: Login2FARequest): Observable<LoginResponse> {
        return this.http
            .post<LoginResponse>(environment.auth.verify2fa, payload)
            .pipe(tap((res) => this.handleAuthSuccess(res)));
    }

    resend2FA(tempToken: string): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(environment.auth.resend2fa, {
            tempToken,
        });
    }

    setup2FA(payload: Setup2FARequest): Observable<Setup2FAResponse> {
        return this.http.post<Setup2FAResponse>(
            environment.auth.setup2fa,
            payload,
        );
    }

    verify2FASetup(
        payload: Verify2FASetupRequest,
    ): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(
            environment.auth.verify2faSetup,
            payload,
        );
    }

    requestSensitiveOTP(
        payload: RequestSensitiveOTPRequest,
    ): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(
            environment.auth.requestOTP,
            payload,
        );
    }

    verifySensitiveOTP(
        payload: VerifySensitiveOTPRequest,
    ): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(
            environment.auth.verifyOTP,
            payload,
        );
    }

    forgetPassword(
        payload: ForgetPasswordRequest,
    ): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(
            environment.auth.forgetPassword,
            payload,
        );
    }

    disable2FA(): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(
            environment.auth.disable2fa,
            {},
        );
    }

    logout(): void {
        this.storage.removeItem('access_token');
        this.storage.removeItem('refresh_token');
        this.storage.removeItem('user_id');
        this.currentUser.set(null);
        this.posthog.reset();
    }

    changePassword(
        payload: ChangePasswordRequest,
    ): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(
            environment.auth.changePassword,
            payload,
        );
    }

    verifyEmail(payload: VerifyEmailRequest): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(
            environment.auth.verifyEmail,
            payload,
        );
    }

    resetPassword(payload: ResetPasswordRequest): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(
            environment.auth.resetPassword,
            payload,
        );
    }

    refreshToken(
        refreshToken: string,
    ): Observable<ApiResponse<RefreshTokenResponse>> {
        return this.http
            .post<ApiResponse<RefreshTokenResponse>>(
                environment.auth.refreshToken,
                {
                    refreshToken: refreshToken,
                },
            )
            .pipe(catchError(this.handleError));
    }

    isAuthenticated(): boolean {
        return this.storage.hasItem('access_token');
    }

    getToken(): string | null {
        return this.storage.getItem<string>('access_token');
    }
    getRToken(): string | null {
        return this.storage.getItem<string>('refresh_token');
    }

    getUserId(): string | null {
        return this.storage.getItem<string>('user_id');
    }

    handleAuthSuccess(response: LoginResponse): void {
        if (response.pending_2fa || !response.data) {
            return;
        }

        const { tokens, user } = response.data;
        const { access, refresh } = tokens;
        this.updateUserLocal(user);

        this.storage.setItem('access_token', access);
        this.storage.setItem('refresh_token', refresh);
    }

    updateUserLocal(user: any): void {
        const { workspaceId, avatar, id, email, firstName, lastName } = user;
        const fullName = `${firstName} ${lastName}`.trim();

        if (workspaceId) this.storage.setItem('workspace', workspaceId);
        if (avatar) this.storage.setItem('avatar', avatar);
        if (id) this.storage.setItem('user_id', id);
        if (fullName) this.storage.setItem('user_name', fullName);

        console.log('AuthService: updating user local with:', user);
        this.currentUser.set({
            ...user,
            fullName,
        });
        console.log('AuthService: currentUser signal set to:', this.currentUser());

        this.posthog.identify(id, {
            email,
            name: fullName,
        });
    }

    handleRefreshSuccess(response: ApiResponse<RefreshTokenResponse>): void {
        if (!response.data) {
            return;
        }
        const { access, refresh } = response.data.tokens;

        this.storage.setItem('access_token', access);
        this.storage.setItem('refresh_token', refresh);
    }

    private handleError(error: HttpErrorResponse): Observable<never> {
        console.error('AuthService Error:', error);
        return throwError(() => error);
    }
}

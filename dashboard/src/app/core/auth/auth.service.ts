import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, catchError, tap, throwError } from "rxjs";

import { StorageService } from "@core/services/storage.service";
import { PostHogService } from "@core/3rd-party/posthog";

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
} from "@models/auth.types";
import { environment } from "environments/environment";
import { ApiResponse } from "@models/index";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly posthog = inject(PostHogService);

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(environment.auth.login, credentials)
      .pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    console.log(environment.baseUrl);
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

  forgetPassword(payload: ForgetPasswordRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      environment.auth.forgetPassword,
      payload
    );
  }

  logout(): void {
    this.storage.removeItem("access_token");
    this.storage.removeItem("refresh_token");
    this.storage.removeItem("user_id");
    this.posthog.reset();
  }

  changePassword(payload: ChangePasswordRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      environment.auth.changePassword,
      payload
    );
  }

  verifyEmail(payload: VerifyEmailRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      environment.auth.verifyEmail,
      payload
    );
  }

  resetPassword(payload: ResetPasswordRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      environment.auth.resetPassword,
      payload
    );
  }

  refreshToken(
    refreshToken: string
  ): Observable<ApiResponse<RefreshTokenResponse>> {
    return this.http
      .post<ApiResponse<RefreshTokenResponse>>(environment.auth.refreshToken, {
        refreshToken: refreshToken,
      })
      .pipe(catchError(this.handleError));
  }

  isAuthenticated(): boolean {
    return this.storage.hasItem("access_token");
  }

  getToken(): string | null {
    return this.storage.getItem<string>("access_token");
  }
  getRToken(): string | null {
    return this.storage.getItem<string>("refresh_token");
  }

  getUserId(): string | null {
    return this.storage.getItem<string>("user_id");
  }

  handleAuthSuccess(response: LoginResponse): void {
    const { access, refresh } = response.data.tokens;
    const { workspaceId, avatar, _id, email, name } = response.data.user;

    this.storage.setItem("access_token", access);
    this.storage.setItem("refresh_token", refresh);
    this.storage.setItem("workspace", workspaceId);
    this.storage.setItem("avatar", avatar);
    this.storage.setItem("user_id", _id);

    this.posthog.identify(_id, {
      email,
      name,
    });
  }

  handleRefreshSuccess(response: LoginResponse): void {
    const { access, refresh } = response.data.tokens;

    this.storage.setItem("access_token", access);
    this.storage.setItem("refresh_token", refresh);
  }
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error("AuthService Error:", error);
    return throwError(() => error);
  }
}

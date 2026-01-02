import { Routes } from "@angular/router";

export const AuthRoutes: Routes = [
  {
    path: "",
    redirectTo: "register",
    pathMatch: "full",
  },
  {
    path: "login",
    loadComponent: () => import("./login/login.page").then((m) => m.LoginPage),
    data: { animation: "LoginPage" },
  },
  {
    path: "register",
    loadComponent: () =>
      import("./register/register.page").then((m) => m.RegisterPage),
    data: { animation: "RegisterPage" },
  },
  {
    path: "forget-password",
    loadComponent: () =>
      import("./forget-password/forget-password.page").then(
        (m) => m.ForgetPasswordPage
      ),
    data: { animation: "ForgetPassword" },
  },
  {
    path: "reset-password",
    loadComponent: () =>
      import("./reset-password/reset-password.page").then(
        (m) => m.ResetPasswordPage
      ),
    data: { animation: "ResetPassword" },
  },
  {
    path: "verify-email",
    loadComponent: () =>
      import("./verify-email/verify-email.page").then((m) => m.VerifyEmailPage),
    data: { animation: "VerifyEmail" },
  },
];

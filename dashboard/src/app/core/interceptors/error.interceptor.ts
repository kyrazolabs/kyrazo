// import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { catchError, throwError } from 'rxjs';
// import { AuthService } from '../auth/auth.service';
// import { ToastService } from '../../shared/services/toast.service';

// export const errorInterceptor: HttpInterceptorFn = (req, next) => {
//   const authService = inject(AuthService);
//   const toastService = inject(ToastService);
  
//   return next(req).pipe(
//     catchError((error: HttpErrorResponse) => {
//       let errorMessage = 'An unexpected error occurred';
      
//       if (error.error instanceof ErrorEvent) {
//         // Client-side error
//         errorMessage = error.error.message;
//       } else {
//         // Server-side error
//         switch (error.status) {
//           case 401:
//             errorMessage = 'Unauthorized - please sign in again';
//             authService.signOut();
//             break;
//           case 403:
//             errorMessage = 'Forbidden - insufficient permissions';
//             break;
//           case 404:
//             errorMessage = 'Resource not found';
//             break;
//           case 422:
//             errorMessage = error.error?.message || 'Validation error';
//             break;
//           case 429:
//             errorMessage = 'Too many requests - please try again later';
//             break;
//           case 500:
//             errorMessage = 'Server error - please try again later';
//             break;
//           default:
//             errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
//         }
//       }
      
//       // Don't show toast for certain endpoints (like polling)
//       if (!req.url.includes('/health') && !req.url.includes('/poll')) {
//         // toastService.error('Request failed', errorMessage);
//       }
      
//       return throwError(() => ({
//         message: errorMessage,
//         status: error.status,
//         error: error.error
//       }));
//     })
//   );
// };
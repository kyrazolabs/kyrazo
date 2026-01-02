import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { retry, timer, mergeMap, throwError } from 'rxjs';

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  // Only retry GET requests and specific idempotent operations
  const shouldRetry = req.method === 'GET' || 
    req.url.includes('/health') || 
    req.url.includes('/status');
  
  if (!shouldRetry) {
    return next(req);
  }
  
  return next(req).pipe(
    retry({
      count: 3,
      delay: (error: HttpErrorResponse, retryCount: number) => {
        // Don't retry for client errors (4xx) except 408, 429
        if (error.status >= 400 && error.status < 500 && 
            error.status !== 408 && error.status !== 429) {
          return throwError(() => error);
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, retryCount - 1) * 1000;
        return timer(delayMs);
      }
    })
  );
};
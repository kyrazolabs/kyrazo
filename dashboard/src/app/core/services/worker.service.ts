import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, tap, finalize } from 'rxjs';
import { ApiResponse, WorkerStatus } from '@models/index';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root',
})
export class WorkerService {
    private readonly http = inject(HttpClient);

    workers = signal<WorkerStatus[]>([]);
    loading = signal(false);

    getWorkerStatus(): Observable<ApiResponse<WorkerStatus[]>> {
        return this.http
            .get<ApiResponse<WorkerStatus[]>>(environment.worker.status)
            .pipe(catchError(this.handleError));
    }

    private pollingSubscription?: any;
    private pollingRefCount = 0;

    /**
     * Start worker polling with reference counting.
     * Call this when a component needs worker data.
     */
    acquireWorkerPolling() {
        this.pollingRefCount++;
        if (this.pollingRefCount === 1) {
            this.startPoll();
        }
    }

    /**
     * Stop worker polling with reference counting.
     * Call this when a component is destroyed or no longer needs worker data.
     */
    releaseWorkerPolling() {
        this.pollingRefCount--;
        if (this.pollingRefCount <= 0) {
            this.pollingRefCount = 0;
            this.stopPoll();
        }
    }

    /** @deprecated Use acquireWorkerPolling() instead. This now performs a one-off load. */
    loadWorkers() {
        this.getWorkerStatus().subscribe({
            next: (res) => this.workers.set(res.data),
            error: (err) => console.error('One-off worker load failed', err)
        });
    }

    private startPoll() {
        this.loading.set(true);
        this.fetchWorkers();
    }

    private fetchWorkers() {
        this.stopPoll();

        this.getWorkerStatus()
            .pipe(
                catchError((err) => {
                    console.error('Worker polling failed:', err);
                    return throwError(() => err);
                }),
                finalize(() => {
                    this.loading.set(false);
                    this.scheduleNextPoll();
                }),
            )
            .subscribe({
                next: (res) => {
                    if (res?.success) {
                        this.workers.set(res.data);
                    }
                },
                error: () => {
                    // Error is already handled/logged in catchError, 
                    // and finalize ensures the next poll is scheduled.
                }
            });
    }

    private scheduleNextPoll() {
        if (this.pollingRefCount > 0) {
            this.pollingSubscription = setTimeout(() => {
                this.fetchWorkers();
            }, 30000);
        }
    }

    /** @deprecated Use releaseWorkerPolling() instead */
    stopPolling() {
        this.releaseWorkerPolling();
    }

    private stopPoll() {
        if (this.pollingSubscription) {
            clearTimeout(this.pollingSubscription);
            this.pollingSubscription = undefined;
        }
    }


    getBadgeSeverity(
        status: string,
    ):
        | 'success'
        | 'info'
        | 'warn'
        | 'danger'
        | 'secondary'
        | 'contrast'
        | undefined {
        switch (status) {
            case 'running':
                return 'success';
            case 'failed':
                return 'danger';
            case 'pending':
            case 'starting':
            case 'stopping':
                return 'warn';
            case 'stopped':
                return 'secondary';
            default:
                return 'secondary';
        }
    }

    private handleError(error: any): Observable<never> {
        console.error('WorkerService Error:', error);
        return throwError(() => error);
    }
}

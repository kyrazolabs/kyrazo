import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
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

    loadWorkers() {
        this.loading.set(true);
        this.fetchWorkers();

        // Setup polling if not already running
        if (!this.pollingSubscription) {
            this.pollingSubscription = setInterval(
                () => this.fetchWorkers(),
                30000,
            );
        }
    }

    private fetchWorkers() {
        this.getWorkerStatus().subscribe({
            next: (res) => {
                this.workers.set(res.data);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
            },
        });
    }

    stopPolling() {
        if (this.pollingSubscription) {
            clearInterval(this.pollingSubscription);
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

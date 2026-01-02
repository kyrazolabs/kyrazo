import { Injectable, inject } from '@angular/core';
import { Resolve, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { WorkspaceService } from '@core/services/workspace.service';
import { StorageService } from '@core/services/storage.service';
import { IWorkspace } from '@models/workspaces.types';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceSettingsResolver implements Resolve<IWorkspace | null> {

  private workspaceService = inject(WorkspaceService);
  private storageService = inject(StorageService);
  private router = inject(Router);

  resolve(): Observable<IWorkspace | null> {
    const workspaceId = this.storageService.getItem<string>('workspace');

    if (!workspaceId) {
      console.error('No workspace ID found in localStorage');
      this.router.navigate(['/dashboard']);
      return of(null);
    }

    return this.workspaceService.get(workspaceId).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          console.error('Failed to load workspace data:', response);
          this.router.navigate(['/dashboard']);
          return null;
        }
      }),
      catchError(error => {
        console.error('Error loading workspace data:', error);
        this.router.navigate(['/dashboard']);
        return of(null);
      })
    );
  }
}
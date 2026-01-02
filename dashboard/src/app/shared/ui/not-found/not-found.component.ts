import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full text-center">
        <div class="mb-8">
          <div class="mx-auto h-20 w-20 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mb-4">
            <svg class="h-10 w-10 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6M7 20l4-16 4 16H7z"></path>
            </svg>
          </div>
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
          <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Page Not Found</h2>
          <p class="text-gray-500 dark:text-gray-400 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div class="space-y-4">
          <button
            routerLink="/dashboard"
            class="w-full btn btn-primary"
          >
            Go to Dashboard
          </button>
          
          <button
            (click)="goBack()"
            class="w-full btn btn-secondary"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  `
})
export class NotFoundComponent {
  goBack() {
    window.history.back();
  }
  
}
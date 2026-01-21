import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-not-found",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-md w-full text-center">
        <div class="mb-8">
          <div
            class="mx-auto h-20 w-20 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mb-4"
          >
            <svg
              class="h-10 w-10 text-primary-600 dark:text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6M7 20l4-16 4 16H7z"
              ></path>
            </svg>
          </div>
          <h1 class="text-4xl font-bold text-surface-900 dark:text-white mb-2">
            404
          </h1>
          <h2
            class="text-xl font-semibold text-surface-700 dark:text-surface-300 mb-4"
          >
            Page Not Found
          </h2>
          <p class="text-surface-500 dark:text-surface-400 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div class="space-y-4">
          <button
            routerLink="/dashboard"
            class="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            Go to Dashboard
          </button>

          <button
            (click)="goBack()"
            class="w-full px-4 py-2 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-900 dark:text-surface-100 font-semibold rounded-xl transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  `,
})
export class NotFoundComponent {
  goBack() {
    window.history.back();
  }
}

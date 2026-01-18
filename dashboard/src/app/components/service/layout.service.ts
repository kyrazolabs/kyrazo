import {
  effect,
  Injectable,
  signal,
  WritableSignal,
  Inject,
  PLATFORM_ID,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { Subject } from "rxjs";

export interface AppState {
  preset: string;
  primary: string;
  surface: string | undefined | null;
  darkMode: boolean;
  openSidebar: boolean;
}

@Injectable({
  providedIn: "root",
})
export class LayoutService {
  _appState: AppState = {
    preset: "Aura",
    primary: "noir",
    surface: "zinc",
    darkMode: false,
    openSidebar: true,
  };

  appState = signal<AppState>(this._appState);

  transitionComplete: WritableSignal<boolean> = signal<boolean>(false);

  private initialized = false;

  private appStateUpdate = new Subject<AppState>();

  appStateUpdate$ = this.appStateUpdate.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    effect(() => {
      const appState = this.appState();
      if (appState) {
        this.onAppStateUpdate();
      }
    });

    effect(() => {
      const state = this.appState();

      if (!this.initialized || !state) {
        this.initialized = true;
        return;
      }

      this.handleDarkModeTransition(state);
    });

    // Effect to detect openSidebar changes and make decisions
    effect(() => {
      const state = this.appState();
      if (state) {
        this.handleSidebarStateChange(state.openSidebar);
      }
    });
  }

  private handleDarkModeTransition(config: AppState): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if ((document as any).startViewTransition) {
      this.startViewTransition(config);
    } else {
      this.toggleDarkMode(config);
      this.onTransitionEnd();
    }
  }

  private startViewTransition(config: AppState): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const transition = (document as any).startViewTransition(() => {
      this.toggleDarkMode(config);
    });

    transition.ready
      .then(() => {
        this.onTransitionEnd();
      })
      .catch(() => {});
  }

  toggleDarkMode(appState?: AppState): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const _appState = appState || this.appState();
    if (_appState.darkMode) {
      document.documentElement.classList.add("p-dark");
    } else {
      document.documentElement.classList.remove("p-dark");
    }
  }

  private onTransitionEnd() {
    this.transitionComplete.set(true);
    setTimeout(() => {
      this.transitionComplete.set(false);
    });
  }

  onAppStateUpdate() {
    this._appState = { ...this.appState() };
    this.appStateUpdate.next(this.appState());
    this.toggleDarkMode();
  }

  /**
   * Handle sidebar state changes and make decisions based on openSidebar value
   * @param isOpen - Current openSidebar state
   */
  private handleSidebarStateChange(isOpen: boolean): void {
    if (isOpen) {
      // Sidebar is open - perform actions when sidebar opens
      this.onSidebarOpen();
    } else {
      // Sidebar is closed - perform actions when sidebar closes
      this.onSidebarClose();
    }
  }

  /**
   * Called when sidebar opens
   */
  private onSidebarOpen(): void {
    // Add logic for when sidebar opens
    console.log("Sidebar opened");
    // Update the app state to reflect sidebar is open
    this.updateSidebarLayout(true);
  }

  /**
   * Called when sidebar closes
   */
  private onSidebarClose(): void {
    // Add logic for when sidebar closes
    console.log("Sidebar closed");
    // Update the app state to reflect sidebar is closed
    this.updateSidebarLayout(false);
  }

  /**
   * Update layout based on sidebar state
   * @param isOpen - Whether sidebar is open or closed
   */
  private updateSidebarLayout(isOpen: boolean): void {
    // This method can be used to update CSS classes, margins, etc.
    // The actual DOM manipulation will be handled by Angular's change detection
    // through the template bindings we added to app-shell component
    console.log(`Updating layout for sidebar ${isOpen ? "open" : "closed"}`);
  }
}

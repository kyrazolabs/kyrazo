import { Injectable, signal, effect, inject } from "@angular/core";
import type { Theme } from "@models/index";
import { StorageService } from "./storage.service";

@Injectable({
  providedIn: "root",
})
export class ThemeService {
  private readonly THEME_KEY = "kyrazo-theme";
  private readonly storage = inject(StorageService);

  private _theme = signal<Theme>("system");

  readonly theme = this._theme.asReadonly();

  constructor() {
    effect(() => {
      this.applyTheme(this._theme());
    });
  }

  initializeTheme(): void {
    const savedTheme = this.storage.getItem(this.THEME_KEY) as Theme;
    if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
      this._theme.set(savedTheme);
    } else {
      this._theme.set("system");
    }
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
    this.storage.setItem(this.THEME_KEY, theme);
  }

  toggleTheme(): void {
    const currentTheme = this._theme();
    const newTheme = currentTheme === "light" ? "dark" : "light";
    this.setTheme(newTheme);
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove("p-light", "p-dark");

    if (theme === "system") {
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (systemPrefersDark) {
        root.classList.add("p-dark");
      } else {
        root.classList.add("p-light");
      }
    } else {
      root.classList.add(`p-${theme}`);
    }
  }

  isDarkMode(): boolean {
    const theme = this._theme();
    if (theme === "dark") return true;
    if (theme === "light") return false;

    // System theme
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
}

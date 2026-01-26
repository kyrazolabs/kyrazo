import { Injectable, Inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class StorageService {
  private subject = new BehaviorSubject<any>(null);
  changes$ = this.subject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private get storage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? localStorage : null;
  }

  setItem<T>(key: string, value: T): void {
    if (!this.storage) return;
    this.storage.setItem(key, JSON.stringify(value));
    // Emit the change to all subscribers
    this.subject.next({ key, value });
  }

  getItem<T>(key: string): T | null {
    if (!this.storage) return null;
    const item = this.storage.getItem(key);
    if (!item) return null;

    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  }

  removeItem(key: string): void {
    if (!this.storage) return;
    this.storage.removeItem(key);
    this.subject.next({ key, value: null });
  }

  clear(): void {
    if (!this.storage) return;
    this.storage.clear();
  }

  hasItem(key: string): boolean {
    if (!this.storage) return false;
    return this.storage.getItem(key) !== null;
  }
}

import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class StorageService {
  private readonly storage = localStorage;
  private subject = new BehaviorSubject<any>(null);
  changes$ = this.subject.asObservable();

  setItem<T>(key: string, value: T): void {
    this.storage.setItem(key, JSON.stringify(value));
    // Emit the change to all subscribers
    this.subject.next({ key, value });
  }

  getItem<T>(key: string): T | null {
    const item = this.storage.getItem(key);
    if (!item) return null;

    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  }

  removeItem(key: string): void {
    this.storage.removeItem(key);
    this.subject.next({ key, value: null });
  }

  clear(): void {
    this.storage.clear();
  }

  hasItem(key: string): boolean {
    return this.storage.getItem(key) !== null;
  }
}

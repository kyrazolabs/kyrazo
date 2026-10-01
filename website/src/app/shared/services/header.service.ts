import { Injectable, signal } from '@angular/core';
 
export type HeaderTheme = 'light' | 'dark';
 
@Injectable({
    providedIn: 'root',
})
export class HeaderService {
    currentTheme = signal<HeaderTheme>('light');
 
    setTheme(theme: HeaderTheme) {
        this.currentTheme.set(theme);
    }
}

import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SeoService } from './core/services/seo.service';
import { AppConfig } from '@components/app.config';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, AppConfig],
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {
    protected readonly title = signal('website');

    constructor(private seoService: SeoService) {
        this.seoService.init();
    }
}

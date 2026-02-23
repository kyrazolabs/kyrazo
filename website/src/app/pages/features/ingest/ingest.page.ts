import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';

@Component({
    standalone: true,
    selector: 'app-ingest-page',
    imports: [CommonModule, ScrollRevealDirective],
    styleUrl: './ingest.page.scss',
    templateUrl: './ingest.page.html',
})
export class IngestPage {}

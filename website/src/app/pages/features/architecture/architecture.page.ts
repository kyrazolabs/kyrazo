import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';
import { ButtonModule } from 'primeng/button';

@Component({
    standalone: true,
    selector: 'app-architecture-page',
    imports: [CommonModule, ScrollRevealDirective, ButtonModule],
    templateUrl: './architecture.page.html',
})
export class ArchitecturePage {}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-landing-comparison',
    standalone: true,
    imports: [CommonModule, RouterLink, ScrollRevealDirective],
    templateUrl: './comparison.component.html',
})
export class ComparisonComponent {}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';

@Component({
    standalone: true,
    selector: 'app-dispatch-page',
    imports: [CommonModule, ScrollRevealDirective],
    templateUrl: './dispatch.page.html',
})
export class DispatchPage {}

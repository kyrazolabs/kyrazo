import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { trigger, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-footer',
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  animations: [
    trigger('footerAnimation', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(20px)' }), // يبدأ من تحت
        animate('300ms 500ms ease-in', style({ opacity: 1, transform: 'translateY(0)' })) // 500ms delay
      ])
    ])
  ]  
})
export class FooterComponent {
  @Input() animationKey: string = '';
}

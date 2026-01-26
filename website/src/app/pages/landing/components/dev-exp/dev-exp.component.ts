import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";

import { ScrollRevealDirective } from "@shared/directives/scroll-reveal.directive";

@Component({
  selector: "app-landing-dev-exp",
  standalone: true,
  imports: [CommonModule, ButtonModule, ScrollRevealDirective],
  templateUrl: "./dev-exp.component.html",
  styleUrl: "./dev-exp.component.scss",
})
export class DevExpComponent {
  codeSnippet = `import { Kyrazo } from '@kyrazo/sdk';

const kyrazo = new Kyrazo('kz_live_...');

// Send an event
await kyrazo.events.send({
  name: 'user.created',
  data: { 
    id: 'usr_123', 
    email: 'alice@example.com' 
  }
});`;
}

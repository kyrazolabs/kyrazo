import { Component } from '@angular/core';
import { ButtonModule } from "primeng/button";
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-welcome-widget',
  imports: [ButtonModule, RouterLink],
  templateUrl: './welcome-widget.component.html',
  styleUrl: './welcome-widget.component.scss'
})
export class WelcomeWidgetComponent {

}

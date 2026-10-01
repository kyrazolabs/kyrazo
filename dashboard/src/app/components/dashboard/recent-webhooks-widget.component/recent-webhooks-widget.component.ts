import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-recent-webhooks-widget',
  imports: [CommonModule, ButtonModule],
  templateUrl: './recent-webhooks-widget.component.html',
  styleUrl: './recent-webhooks-widget.component.scss'
})
export class RecentWebhooksWidgetComponent {
  webhooks = [
    {
      icon: "pi-circle-fill",
      text: "User Registration Webhook",
      sub: "",
      time: "8/28/25, 12:56 PM",
      color: "text-green-500",
    },
    {
      icon: "pi-circle-fill",
      text: "Payment Processor",
      sub: "",
      time: "8/28/25, 11:26 AM",
      color: "text-green-500",
    },
    {
      icon: "pi-circle-fill",
      text: "Order Updates",
      sub: "",
      time: "8/27/25, 1:26 PM",
      color: "text-yellow-500",
    },
  ];
}

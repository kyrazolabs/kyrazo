import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-recent-deliveries-widget',
  imports: [CommonModule, ButtonModule],
  templateUrl: './recent-deliveries-widget.component.html',
  styleUrl: './recent-deliveries-widget.component.scss'
})
export class RecentDeliveriesWidgetComponent {
  deliveries = [
    {
      icon: "pi-circle-fill",
      text: "user.created",
      sub: "",
      time: "8/28/25, 1:21 PM",
      color: "text-green-500",
    },
    {
      icon: "pi-circle-fill",
      text: "payment.completed",
      sub: "",
      time: "8/28/25, 1:11 PM",
      color: "text-green-500",
    },
    {
      icon: "pi-circle-fill",
      text: "order.updated",
      sub: "",
      time: "8/28/25, 12:56 PM",
      color: "text-red-500",
    },
    {
      icon: "pi-circle-fill",
      text: "invoice.paid",
      sub: "",
      time: "8/28/25, 12:41 PM",
      color: "text-slate-500",
    },
  ];
}

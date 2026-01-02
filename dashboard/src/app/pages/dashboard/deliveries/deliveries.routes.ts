import { Routes } from '@angular/router';
import { deliveriesResolver, deliveryResolver } from '@core/resolver/delivery.resolver';

export const deliveriesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./delivery-list/delivery-list.page').then(p => p.DeliveryListPage),
    resolve: { deliveries: deliveriesResolver },
    data: { title: "Deliveries", animation: 'delivery-list' }
  },
  {
    path: ':id',
    loadComponent: () => import('./delivery-detail/delivery-detail.page').then(p => p.DeliveryDetailPage),
    resolve: { delivery: deliveryResolver },
    data: { title: "Delivery Details", animation: 'delivery-detail' }
  }
];
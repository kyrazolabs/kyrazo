import { AutoScalerService } from '@/modules/autoscaler/autoscaler.service';

export async function subscriptionsJob() {
    try {
        await AutoScalerService.reconcile();
    } catch (err: any) {
        console.error('Subscriptions Job Failed:', err);
    }
}

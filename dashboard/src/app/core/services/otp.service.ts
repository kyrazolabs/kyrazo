import { Injectable, signal } from '@angular/core';
import { SensitiveAction } from '@models/auth.types';

export interface OtpDialogState {
    show: boolean;
    action: SensitiveAction | null;
    method?: 'app' | 'email';
    message: string;
    onSuccess: () => void;
    onCancel: () => void;
}

@Injectable({
    providedIn: 'root',
})
export class OtpService {
    private initialState: OtpDialogState = {
        show: false,
        action: null,
        message: '',
        onSuccess: () => {},
        onCancel: () => {},
    };

    private currentOtpPromises = new Map<string, Promise<boolean>>();
    state = signal<OtpDialogState>(this.initialState);

    showOtpDialog(
        action: SensitiveAction,
        message: string = 'Verification Required',
        method?: 'app' | 'email',
    ): Promise<boolean> {
        const key = `${action}_${method || 'default'}`;
        
        if (this.currentOtpPromises.has(key)) {
            return this.currentOtpPromises.get(key)!;
        }

        const promise = new Promise<boolean>((resolve) => {
            this.state.set({
                show: true,
                action,
                method,
                message,
                onSuccess: () => {
                    this.close(key);
                    resolve(true);
                },
                onCancel: () => {
                    this.close(key);
                    resolve(false);
                },
            });
        });

        this.currentOtpPromises.set(key, promise);
        return promise;
    }

    close(key?: string) {
        if (key) {
            this.currentOtpPromises.delete(key);
        } else {
            this.currentOtpPromises.clear();
        }
        this.state.set(this.initialState);
    }

}

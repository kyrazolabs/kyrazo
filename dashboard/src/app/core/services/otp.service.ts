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

    state = signal<OtpDialogState>(this.initialState);

    showOtpDialog(
        action: SensitiveAction,
        message: string = 'Verification Required',
        method?: 'app' | 'email',
    ): Promise<boolean> {
        return new Promise((resolve) => {
            this.state.set({
                show: true,
                action,
                method,
                message,
                onSuccess: () => {
                    this.close();
                    resolve(true);
                },
                onCancel: () => {
                    this.close();
                    resolve(false);
                },
            });
        });
    }

    close() {
        this.state.set(this.initialState);
    }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface DialogMessage {
    type: string;
    data: any;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
    private messageSource = new BehaviorSubject<DialogMessage | null>(null);
    message$ = this.messageSource.asObservable();

    showMessage(type: string, data: any) {
        this.messageSource.next({ type, data });
    }

    clear() {
        this.messageSource.next(null);
    }
}

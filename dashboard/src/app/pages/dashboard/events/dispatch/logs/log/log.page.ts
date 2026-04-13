import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { InputTextModule } from 'primeng/inputtext';
import { CodeEditorComponent } from '@shared/components/code-editor/code-editor.component';
import { CopyIdComponent } from '@shared/components/copy-id/copy-id.component';

import { LoaderService } from '@core/services/loader.service';
import { DeliveryService } from '@core/services/delivery.service';
import { IDeliveryAttempt } from '@models/delivery.types';

@Component({
    selector: 'app-log.page',
    imports: [
        CommonModule,
        RouterModule,
        CardModule,
        ButtonModule,
        TagModule,
        DividerModule,
        ScrollPanelModule,
        InputTextModule,
        CodeEditorComponent,
        FormsModule,
        CopyIdComponent,
    ],
    templateUrl: './log.page.html',
    styleUrl: './log.page.scss',
})
export class LogPage {
    private readonly das = inject(DeliveryService);
    loader = inject(LoaderService);

    delivery: IDeliveryAttempt;
    rawView = false;
    payload = {
        field_0: 'some string',
        field_1: 'some string',
        nested: {
            key: 'value',
            list: [1, 2, 3],
            deeper: {
                okay: true,
            },
        },
    };

    constructor(private route: ActivatedRoute) {}

    ngOnInit() {
        const data = this.route.snapshot.data['data'];
        if (!data) return;

        this.delivery = {
            ...data,
            request_header: this.tryParse(data.request_header),
            request_body: this.tryParse(data.request_body),
            response_header: this.tryParse(data.response_header),
            response_body: this.tryParse(data.response_body),
        };
    }

    tryParse(value: any) {
        if (typeof value !== 'string') return value;
        try {
            const parsed = JSON.parse(value);
            return parsed;
        } catch {
            return value;
        }
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
        switch (status.toLowerCase()) {
            case 'delivered':
                return 'success';
            case 'pending':
                return 'info';
            case 'failed':
                return 'danger';
            case 'retry':
                return 'warn';
            default:
                return 'info';
        }
    }

    getResponseCodeSeverity(
        responseCode?: number | null,
    ): 'success' | 'info' | 'warn' | 'danger' {
        if (responseCode === undefined || responseCode === null) return 'info';

        if (responseCode >= 200 && responseCode < 300) {
            return 'success';
        } else if (responseCode >= 300 && responseCode < 400) {
            return 'info';
        } else if (responseCode >= 400 && responseCode < 500) {
            return 'warn';
        } else if (responseCode >= 500) {
            return 'danger';
        }

        return 'info';
    }

    stringifyData(data: any): string {
        if (!data) return '';
        if (typeof data === 'string') {
            try {
                return JSON.stringify(JSON.parse(data), null, 2);
            } catch {
                return data;
            }
        }
        return JSON.stringify(data, null, 2);
    }

    toggleRawView() {
        this.rawView = !this.rawView;
    }

    async copy(data: any) {
        try {
            await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            // Optionally show a message, but for now just copy
        } catch (err: any) {
            console.error('Failed to copy: ', err);
        }
    }
}

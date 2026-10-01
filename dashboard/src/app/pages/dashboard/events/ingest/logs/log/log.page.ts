import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { InputTextModule } from 'primeng/inputtext';
import { CodeEditorComponent } from '@shared/components/code-editor/code-editor.component';
import { CopyIdComponent } from '@shared/components/copy-id/copy-id.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { LoaderService } from '@core/services/loader.service';
import { DeliveryService, IngestEvent } from '@core/services/delivery.service';

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
        ProgressSpinnerModule,
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

    ingestEvent: IngestEvent;
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

    async ngOnInit() {
        const data = this.route.snapshot.data['data'] as IngestEvent;
        this.ingestEvent = data;
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
        switch (status.toLowerCase()) {
            case 'processed':
                return 'success';
            case 'pending':
                return 'info';
            case 'failed':
                return 'danger';
            default:
                return 'info';
        }
    }

    toggleRawView() {
        this.rawView = !this.rawView;
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

    parseJson(jsonString: string): any {
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            return null;
        }
    }

    async copy(data: any) {
        try {
            await navigator.clipboard.writeText(
                typeof data === 'string' ? data : JSON.stringify(data, null, 2),
            );
            // Optionally show a message, but for now just copy
        } catch (err: any) {
            console.error('Failed to copy: ', err);
        }
    }
}

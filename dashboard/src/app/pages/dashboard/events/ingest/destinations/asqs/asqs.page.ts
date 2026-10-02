import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';

import { ASQSService } from '@core/services/asqs.service';
import { IASQSQueue } from '@models/asqs.types';
import { DialogService } from '@shared/services/dialog.service';
import { LoaderService } from '@core/services/loader.service';
import { CopyIdComponent } from '@shared/components/copy-id/copy-id.component';
import { SentryService } from '@core/3rd-party/sentry';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
    selector: 'app-asqs-queues',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        TableModule,
        ButtonModule,
        TagModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        CardModule,
        ConfirmDialogModule,
        ToastModule,
        TooltipModule,
        PaginatorModule,
        CopyIdComponent,
    ],
    templateUrl: './asqs.page.html',
})
export class ASQSPage implements OnInit {
    @ViewChild('dt') dt!: Table;

    public loader = inject(LoaderService);
    private asqsService = inject(ASQSService);
    public dialogService = inject(DialogService);
    private sentry = inject(SentryService);
    private confirmationService = inject(ConfirmationService);
    private messageService = inject(MessageService);

    queues: IASQSQueue[] = [];
    filteredQueues: IASQSQueue[] = [];
    searchQuery = '';

    ngOnInit() {
        this.loadQueues();
        this.dialogService.asqsSaved$.subscribe(() => {
            this.loadQueues();
        });
    }

    loadQueues() {
        this.loader.show();
        this.asqsService.gets()
            .pipe(finalize(() => this.loader.hide()))
            .subscribe({
                next: (res) => {
                    this.queues = res.data || [];
                    this.applyFiltering();
                },
                error: (err) => {
                    this.sentry.captureException(err);
                }
            });
    }

    applyFiltering() {
        if (!this.searchQuery) {
            this.filteredQueues = [...this.queues];
            return;
        }
        const query = this.searchQuery.toLowerCase();
        this.filteredQueues = this.queues.filter(q => 
            q.name.toLowerCase().includes(query) || 
            q.queueUrl.toLowerCase().includes(query) ||
            q.id.toLowerCase().includes(query)
        );
    }

    onSearchInput(event: any) {
        this.searchQuery = event.target.value;
        this.applyFiltering();
    }

    openCreateDialog() {
        this.dialogService.openASQSDialog();
    }

    openEditDialog(queue: IASQSQueue) {
        this.dialogService.openASQSDialog(queue.id);
    }

    deleteQueue(queue: IASQSQueue) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${queue.name}"? This action cannot be undone.`,
            header: 'Delete SQS Queue',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.loader.show();
                this.asqsService.delete(queue.id)
                    .pipe(finalize(() => this.loader.hide()))
                    .subscribe({
                        next: () => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Success',
                                detail: 'Queue deleted successfully',
                            });
                            this.loadQueues();
                        },
                        error: (err) => {
                            this.sentry.captureException(err);
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: err.message || 'Failed to delete queue',
                            });
                        }
                    });
            },
        });
    }

    refreshQueues() {
        this.searchQuery = '';
        this.loadQueues();
    }
}

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

import { S3Service } from '@core/services/s3.service';
import { IS3Bucket } from '@models/s3.types';
import { DialogService } from '@shared/services/dialog.service';
import { LoaderService } from '@core/services/loader.service';
import { CopyIdComponent } from '@shared/components/copy-id/copy-id.component';
import { SentryService } from '@core/3rd-party/sentry';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
    selector: 'app-s3-buckets',
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
    templateUrl: './s3.page.html',
})
export class S3Page implements OnInit {
    @ViewChild('dt') dt!: Table;

    public loader = inject(LoaderService);
    private s3Service = inject(S3Service);
    public dialogService = inject(DialogService);
    private sentry = inject(SentryService);
    private confirmationService = inject(ConfirmationService);
    private messageService = inject(MessageService);

    buckets: IS3Bucket[] = [];
    filteredBuckets: IS3Bucket[] = [];
    searchQuery = '';

    ngOnInit() {
        this.loadBuckets();
        this.dialogService.s3Saved$.subscribe(() => {
            this.loadBuckets();
        });
    }

    loadBuckets() {
        this.loader.show();
        this.s3Service.gets()
            .pipe(finalize(() => this.loader.hide()))
            .subscribe({
                next: (res) => {
                    this.buckets = res.data || [];
                    this.applyFiltering();
                },
                error: (err) => {
                    this.sentry.captureException(err);
                }
            });
    }

    applyFiltering() {
        if (!this.searchQuery) {
            this.filteredBuckets = [...this.buckets];
            return;
        }
        const query = this.searchQuery.toLowerCase();
        this.filteredBuckets = this.buckets.filter(b => 
            b.name.toLowerCase().includes(query) || 
            b.bucketName.toLowerCase().includes(query) ||
            b.id.toLowerCase().includes(query)
        );
    }

    onSearchInput(event: any) {
        this.searchQuery = event.target.value;
        this.applyFiltering();
    }

    openCreateDialog() {
        this.dialogService.openS3Dialog();
    }

    openEditDialog(bucket: IS3Bucket) {
        this.dialogService.openS3Dialog(bucket.id);
    }

    deleteBucket(bucket: IS3Bucket) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${bucket.name}"? This action cannot be undone.`,
            header: 'Delete S3 Bucket',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.loader.show();
                this.s3Service.delete(bucket.id)
                    .pipe(finalize(() => this.loader.hide()))
                    .subscribe({
                        next: () => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Success',
                                detail: 'Bucket deleted successfully',
                            });
                            this.loadBuckets();
                        },
                        error: (err) => {
                            this.sentry.captureException(err);
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: err.message || 'Failed to delete bucket',
                            });
                        }
                    });
            },
        });
    }

    refreshBuckets() {
        this.searchQuery = '';
        this.loadBuckets();
    }
}

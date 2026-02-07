import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FormsModule } from '@angular/forms';

import { EndpointService } from '@core/services/endpoint.service';
import { SentryService } from '@core/3rd-party/sentry';
import { DialogService } from '@shared/services/dialog.service';
import { Endpoint } from '@models/endpoint.types';

@Component({
    selector: 'app-endpoint-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        CardModule,
        ButtonModule,
        TagModule,
        DividerModule,
        TooltipModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule,
        CheckboxModule,
        IconFieldModule,
        InputIconModule,
        FormsModule,
    ],
    templateUrl: './detail.page.html',
    styleUrl: './detail.page.scss',
    providers: [EndpointService],
})
export class EndpointDetailPage implements OnInit {
    private route = inject(ActivatedRoute);
    private eps = inject(EndpointService);
    private sentry = inject(SentryService);
    public dialogService = inject(DialogService);

    endpoint = signal<Partial<Endpoint>>({});

    ngOnInit(): void {
        this.loadEndpoint();

        this.dialogService.endpointSaved$.subscribe(() => {
            this.loadEndpoint();
        });
    }

    loadEndpoint() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.eps.get(id).subscribe({
                next: (response) => {
                    const data: Partial<Endpoint> = {
                        ...response.data,
                        stats: {
                            totalRequests: 1547,
                            successfulRequests: 1489,
                            failedRequests: 58,
                            avgResponseTime: 245,
                        },
                    };
                    this.endpoint.set(data);
                },
                error: (error) => {
                    this.sentry.captureException(error);
                    console.error(error);
                },
            });
        }
    }

    openEditDialog() {
        const id = this.endpoint().id;
        if (id) {
            this.dialogService.openEndpointDialog(id);
        }
    }

    getSuccessRate(): number {
        const stats = this.endpoint()?.stats;
        if (!stats) return 0;

        const { totalRequests, successfulRequests } = stats;
        return totalRequests > 0
            ? Math.round((successfulRequests / totalRequests) * 100)
            : 0;
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
        switch (status.toLowerCase()) {
            case 'active':
                return 'success';
            case 'inactive':
                return 'danger';
            case 'pending':
                return 'warn';
            default:
                return 'info';
        }
    }

    formatDate(dateString: string): string {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    // MessageService is not injected in this component yet, need to add it or use console/toast
    // The previous implementation used console.log and commented out "toast here"
    // I need to inject MessageService to show toast, or at least handle the tooltip state.

    // Actually, I should inject MessageService in providers array and constructor/inject.
    // Looking at file imports, MessageService is NOT imported.

    // I will add MessageService import and injection in a separate step if needed, but for now I'll stick to the tooltip logic.
    // Wait, the TargetPage used MessageService. This component has `console.log` and a comment.
    // I should check if I can use MessageService. It is not in the imports.
    // I will add the tooltip signal logic first.

    isCopied = signal<boolean>(false);

    copyToClipboard(text: string): void {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                // messageService is not available here, so I will skip the toast or add it later if needed.
                // The user asked for TOOLTIP feedback.
                this.copyTooltip.set('Copied!');
                this.isCopied.set(true);
                setTimeout(() => {
                    this.copyTooltip.set('Copy Secret');
                    this.isCopied.set(false);
                }, 2000);
            })
            .catch((err) => {
                console.error('Failed to copy:', err);
            });
    }

    // Secret Management
    signingSecret = signal<string | null>(null);
    isSecretVisible = signal<boolean>(false);
    loadingSecret = signal<boolean>(false);
    copyTooltip = signal<string>('Copy Secret');

    toggleSecret() {
        if (this.isSecretVisible()) {
            this.isSecretVisible.set(false);
            return;
        }

        if (this.signingSecret()) {
            this.isSecretVisible.set(true);
            return;
        }

        const id = this.endpoint().id;
        if (!id) return;

        this.loadingSecret.set(true);
        this.eps.getSecret(id).subscribe({
            next: (response) => {
                this.signingSecret.set(response.data);
                this.isSecretVisible.set(true);
                this.loadingSecret.set(false);
            },
            error: (error) => {
                this.sentry.captureException(error);
                console.error('Failed to fetch secret:', error);
                this.loadingSecret.set(false);
            },
        });
    }
}

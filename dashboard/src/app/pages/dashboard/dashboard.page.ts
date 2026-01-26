import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Widgets
import { WelcomeWidgetComponent } from '@components/welcome-widget.component/welcome-widget.component';
import { QuickActionsWidgetComponent } from '@components/quick-actions-widget/quick-actions-widget.component';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Shared Components
import { SupportDialogComponent } from '@shared/components/support-dialog/support-dialog.component';

// Services
import { ProjectService } from '@core/services/project.service';
import { SentryService } from '@core/3rd-party/sentry';

@Component({
    selector: 'app-dashboard.page',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        WelcomeWidgetComponent,
        QuickActionsWidgetComponent,
        CardModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        ToastModule,
        SupportDialogComponent,
    ],
    templateUrl: './dashboard.page.html',
    styleUrl: './dashboard.page.scss',
    providers: [MessageService],
})
export class DashboardPage {
    private projectService = inject(ProjectService);
    private messageService = inject(MessageService);
    private sentry = inject(SentryService);

    // Dialog State
    projectDialogVisible = false;
    isCreating = false;

    // Form Data
    projectForm = {
        name: '',
        description: '',
    };

    // Support Dialog State
    supportDialogVisible = false;

    // Navigation Cards Configuration
    navCards = [
        {
            title: 'Ingest',
            subtitle: 'Sources & Events',
            description: 'Manage your data entry points and event sources.',
            icon: 'icon-[hugeicons--inbox-download] size-6',
            color: 'text-blue-500',
            bg: 'bg-blue-50 dark:bg-blue-900/10',
            route: '/events/ingest/sources',
            actionLabel: 'Manage Sources',
        },
        {
            title: 'Dispatch',
            subtitle: 'Targets & Delivery',
            description: 'Configure destination endpoints and delivery rules.',
            icon: 'icon-[hugeicons--rocket-01] size-6',
            color: 'text-emerald-500',
            bg: 'bg-emerald-50 dark:bg-emerald-900/10',
            route: '/events/dispatch/targets',
            actionLabel: 'Manage Targets',
        },
        {
            title: 'Live Logs',
            subtitle: 'Observability',
            description: 'Track and debug webhook events in real-time.',
            icon: 'icon-[hugeicons--transaction-history] size-6',
            color: 'text-amber-500',
            bg: 'bg-amber-50 dark:bg-amber-900/10',
            route: '/events/dispatch/logs',
            actionLabel: 'View Logs',
        },
        {
            title: 'Developers',
            subtitle: 'Keys & Docs',
            description: 'Manage API keys and access developer resources.',
            icon: 'pi pi-key text-xl!',
            color: 'text-purple-500',
            bg: 'bg-purple-50 dark:bg-purple-900/10',
            route: '/secrets',
            actionLabel: 'API Settings',
        },
    ];

    handleQuickAction(actionId: string) {
        if (actionId === 'new-project') {
            this.openCreateProjectDialog();
        }
    }

    openCreateProjectDialog() {
        this.projectForm = { name: '', description: '' };
        this.projectDialogVisible = true;
    }

    createProject() {
        if (!this.projectForm.name.trim()) return;

        this.isCreating = true;
        this.projectService.create(this.projectForm).subscribe({
            next: (response) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Project created successfully',
                });
                this.projectDialogVisible = false;
                this.isCreating = false;
            },
            error: (err) => {
                this.sentry.captureException(err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to create project',
                });
                this.isCreating = false;
            },
        });
    }

    // Support dialog
    openSupportDialog() {
        this.supportDialogVisible = true;
    }
}

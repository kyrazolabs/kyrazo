import { Component, inject, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormsModule,
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

// PrimeNG Imports
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { MessageService } from 'primeng/api';

// Services and Types
import { WorkspaceService } from '@core/services/workspace.service';
import { SubscriptionService } from '@core/services/subscription.service';
import { SentryService } from '@core/3rd-party/sentry';
import { PostHogService } from '@core/3rd-party/posthog';
import { InviteWorkspaceMemberRequest } from '@models/workspaces.types';

@Component({
    selector: 'app-invite-member-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        InputTextModule,
        TextareaModule,
        ButtonModule,
        Select,
    ],
    templateUrl: './invite-member-form.component.html',
})
export class InviteMemberFormComponent implements OnInit {
    workspaceId = input.required<string | null>();
    onSuccess = output<any>();
    onCancel = output<void>();

    private readonly fb = inject(FormBuilder);
    private readonly workspaceService = inject(WorkspaceService);
    private readonly messageService = inject(MessageService);
    private readonly sentry = inject(SentryService);
    private readonly posthog = inject(PostHogService);
    public readonly subscriptionService = inject(SubscriptionService);

    inviteForm!: FormGroup;
    isInviting = false;

    roleOptions = [
        { label: 'Admin', value: 'admin' },
        { label: 'Member', value: 'member' },
        { label: 'Viewer', value: 'viewer' },
    ];

    ngOnInit() {
        this.inviteForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            role: ['member', [Validators.required]],
            message: ['', [Validators.maxLength(2000)]],
        });
    }

    inviteMember() {
        if (!this.inviteForm.valid || this.isInviting || !this.workspaceId()) {
            return;
        }

        this.isInviting = true;
        const formData = this.inviteForm.value;

        const inviteData: InviteWorkspaceMemberRequest = {
            email: formData.email,
            role: formData.role,
            message: formData.message || undefined,
        };

        this.workspaceService
            .inviteUser(this.workspaceId()!, inviteData)
            .pipe(finalize(() => (this.isInviting = false)))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Invitation sent successfully!',
                        });
                        this.posthog.capture('workspace_invitation_sent', {
                            role: formData.role,
                        });
                        this.onSuccess.emit(null);
                        this.inviteForm.reset({ role: 'member' });
                    }
                },
                error: (error: any) => {
                    this.sentry.captureException(error);
                    const errorMessage =
                        error.error?.error?.code === 'LIMIT_EXCEEDED'
                            ? 'Member limit exceeded for your current plan.'
                            : error.error?.error?.message ||
                              error.message ||
                              'Failed to send invitation';

                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: errorMessage,
                    });
                    this.posthog.capture('workspace_invitation_error', {
                        error: error.message,
                    });
                },
            });
    }

    cancel() {
        this.onCancel.emit();
        this.inviteForm.reset({ role: 'member' });
    }
}

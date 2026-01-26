import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormsModule,
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

// Services and Types
import { WorkspaceService } from '@core/services/workspace.service';
import { StorageService } from '@core/services/storage.service';
import { SettingService } from '@core/services/settings.service';
import {
    IWorkspace,
    IWorkspaceMember,
    WorkspaceRole,
    InviteWorkspaceMemberRequest,
    UpdateWorkspaceMemberRoleRequest,
} from '@models/workspaces.types';
import { UserProfileResponse } from '@models/auth.types';
import { finalize } from 'rxjs';
import { SentryService } from '@core/3rd-party/sentry';
import { PostHogService } from '@core/3rd-party/posthog';

@Component({
    selector: 'app-workspace-settings',
    imports: [
        RouterLink,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        CardModule,
        InputTextModule,
        TextareaModule,
        ButtonModule,
        TableModule,
        TagModule,
        TooltipModule,
        ToastModule,
        DialogModule,
        SelectModule,
        ConfirmDialogModule,
    ],
    templateUrl: './workspace-settings.page.html',
    styleUrl: './workspace-settings.page.scss',
})
export class WorkspaceSettingsPage implements OnInit {
    private route = inject(ActivatedRoute);
    private readonly workspaceService = inject(WorkspaceService);
    private readonly storageService = inject(StorageService);
    private readonly settingService = inject(SettingService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly sentry = inject(SentryService);
    private readonly posthog = inject(PostHogService);

    // Reactive forms
    workspaceForm!: FormGroup;
    inviteForm!: FormGroup;

    // Data
    workspace: IWorkspace | null = null;
    members: IWorkspaceMember[] = [];
    currentUserId: string | null = null;
    currentUserRole: WorkspaceRole = 'member';

    // UI state
    isSaving = false;
    showInviteDialog = false;
    isInviting = false;

    // Role options
    roleOptions = [
        { label: 'Owner', value: 'owner' },
        { label: 'Admin', value: 'admin' },
        { label: 'Member', value: 'member' },
        { label: 'Viewer', value: 'viewer' },
    ];

    ngOnInit() {
        this.initializeForms();

        // Get workspace data from resolver
        const resolvedWorkspace = this.route.snapshot.data[
            'workspace'
        ] as IWorkspace;
        if (resolvedWorkspace) {
            this.workspace = resolvedWorkspace;
            this.workspaceForm.patchValue({
                name: this.workspace.name,
                description: this.workspace.description || '',
            });
            this.loadWorkspaceMembers();
        } else {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load workspace data',
            });
        }
    }

    private initializeForms() {
        this.workspaceForm = this.fb.group({
            name: [
                '',
                [
                    Validators.required,
                    Validators.minLength(2),
                    Validators.maxLength(100),
                ],
            ],
            description: ['', [Validators.maxLength(2000)]],
        });

        this.inviteForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            role: ['member', [Validators.required]],
            message: ['', [Validators.maxLength(2000)]],
        });
    }

    private loadWorkspaceMembers() {
        if (!this.workspace) return;

        // Load workspace members
        this.workspaceService.getMembers(this.workspace._id).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.members = response.data;
                    // Get current user ID from profile endpoint
                    this.settingService.get().subscribe({
                        next: (profileResponse: {
                            success: boolean;
                            data: UserProfileResponse;
                        }) => {
                            if (
                                profileResponse.success &&
                                profileResponse.data
                            ) {
                                this.currentUserId = profileResponse.data.id;
                                const currentUserMember = this.members.find(
                                    (m) =>
                                        this.getMemberUserId(m) ===
                                        this.currentUserId,
                                );
                                this.currentUserRole =
                                    currentUserMember?.role || 'member';
                            }
                        },
                        error: (error: any) => {
                            this.sentry.captureException(error);
                            console.error('Error getting current user:', error);
                            this.currentUserRole = 'member'; // fallback
                        },
                    });
                }
            },
            error: (error) => {
                this.sentry.captureException(error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load workspace members',
                });
                console.error('Error loading members:', error);
            },
        });
    }

    saveWorkspace() {
        if (!this.workspaceForm.valid || this.isSaving || !this.workspace) {
            return;
        }

        this.isSaving = true;
        const formData = this.workspaceForm.value;

        this.workspaceService
            .update(this.workspace._id, {
                name: formData.name,
                description: formData.description || null,
            })
            .pipe(finalize(() => (this.isSaving = false)))
            .subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.workspace = response.data;
                        this.messageService.add({
                            summary: 'Success',
                            detail: 'Workspace settings saved successfully!',
                        });
                        this.posthog.capture('workspace_updated', {
                            workspace_id: this.workspace?._id,
                        });
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to save workspace settings',
                        });
                    }
                },
                error: (error) => {
                    this.sentry.captureException(error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to save workspace settings',
                    });
                    this.posthog.capture('workspace_update_error', {
                        workspace_id: this.workspace?._id,
                        error: error.message,
                    });
                    console.error('Error saving workspace:', error);
                },
            });
    }

    openInviteDialog() {
        this.inviteForm.reset({ role: 'member' });
        this.showInviteDialog = true;
    }

    closeInviteDialog() {
        this.showInviteDialog = false;
        this.inviteForm.reset();
    }

    inviteMember() {
        if (!this.inviteForm.valid || this.isInviting || !this.workspace) {
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
            .inviteUser(this.workspace._id, inviteData)
            .pipe(finalize(() => (this.isInviting = false)))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.messageService.add({
                            summary: 'Success',
                            detail: 'Invitation sent successfully!',
                        });
                        this.posthog.capture('workspace_invitation_sent', {
                            role: formData.role,
                        });
                        this.closeInviteDialog();

                        // Reload members to show pending invitation
                        this.loadWorkspaceMembers();
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to send invitation',
                        });
                    }
                },
                error: (error) => {
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
                    console.error('Error inviting member:', error);
                },
            });
    }

    updateMemberRole(member: IWorkspaceMember, newRole: WorkspaceRole) {
        if (!this.workspace || !this.canManageMember(member)) {
            return;
        }

        const updateData: UpdateWorkspaceMemberRoleRequest = {
            userId: member.userId,
            role: newRole,
        };

        this.workspaceService
            .updateUserRole(this.workspace._id, updateData)
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.messageService.add({
                            summary: 'Success',
                            detail: 'Member role updated successfully!',
                        });
                        this.posthog.capture('workspace_member_role_updated', {
                            target_member_id: member.userId,
                            new_role: newRole,
                        });
                        // Update local member data

                        member.role = newRole;
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to update member role',
                        });
                    }
                },
                error: (error) => {
                    this.sentry.captureException(error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to update member role',
                    });
                    this.posthog.capture('workspace_member_role_error', {
                        target_member_id: member.userId,
                        error: error.message,
                    });
                    console.error('Error updating member role:', error);
                },
            });
    }

    removeMember(member: IWorkspaceMember) {
        if (!this.workspace || !this.canManageMember(member)) {
            return;
        }

        this.confirmationService.confirm({
            message: `Are you sure you want to remove ${member.user?.firstName} ${member.user?.lastName} from this workspace?`,
            header: 'Remove Member',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.workspaceService
                    .removeUser(this.workspace!._id, member.userId)
                    .subscribe({
                        next: (response) => {
                            if (response.success) {
                                this.messageService.add({
                                    severity: 'success',
                                    summary: 'Success',
                                    detail: 'Member removed successfully!',
                                });
                                // Remove from local array
                                this.members = this.members.filter(
                                    (m) => m._id !== member._id,
                                );
                            } else {
                                this.messageService.add({
                                    severity: 'error',
                                    summary: 'Error',
                                    detail: 'Failed to remove member',
                                });
                            }
                        },
                        error: (error) => {
                            this.sentry.captureException(error);
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'Failed to remove member',
                            });
                            console.error('Error removing member:', error);
                        },
                    });
            },
        });
    }

    canManageMember(member: IWorkspaceMember): boolean {
        const memberUserId = this.getMemberUserId(member);

        // Owners can manage everyone except themselves
        if (this.currentUserRole === 'owner') {
            return memberUserId !== this.currentUserId;
        }

        // Admins can manage members and viewers, but not other admins or owners
        if (this.currentUserRole === 'admin') {
            return (
                ['member', 'viewer'].includes(member.role) &&
                memberUserId !== this.currentUserId
            );
        }

        return false;
    }

    getMemberUserId(member: IWorkspaceMember): string {
        if (!member.userId) return '';
        return typeof member.userId === 'object'
            ? (member.userId as any)._id
            : member.userId;
    }

    canEditWorkspace(): boolean {
        return ['owner', 'admin'].includes(this.currentUserRole);
    }

    canInviteMembers(): boolean {
        return ['owner', 'admin'].includes(this.currentUserRole);
    }

    getRoleSeverity(
        role: WorkspaceRole,
    ): 'success' | 'info' | 'warn' | 'danger' {
        switch (role) {
            case 'owner':
                return 'danger';
            case 'admin':
                return 'warn';
            case 'member':
                return 'info';
            case 'viewer':
                return 'success';
            default:
                return 'info';
        }
    }

    formatDate(date: Date | string) {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    copyToClipboard(text: string) {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Copied',
                    detail: 'Text copied to clipboard!',
                });
            })
            .catch(() => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to copy to clipboard',
                });
            });
    }

    deleteWorkspace() {
        if (!this.workspace || this.currentUserRole !== 'owner') {
            return;
        }

        this.confirmationService.confirm({
            message: `Are you sure you want to delete the workspace "${this.workspace.name}"? This action is permanent and will delete all associated data.`,
            header: 'Delete Workspace',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger rounded-xl!',
            rejectButtonStyleClass: 'p-button-text rounded-xl!',
            accept: () => {
                this.workspaceService.delete(this.workspace!._id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.messageService.add({
                                severity: 'success',
                                detail: 'Workspace deleted successfully!',
                            });
                            this.posthog.capture('workspace_deleted', {
                                workspace_id: this.workspace?._id,
                            });
                            // Force storage update and navigate to dash

                            this.storageService.removeItem(
                                'currentWorkspaceId',
                            );
                            this.router.navigate(['/']);
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'Failed to delete workspace',
                            });
                        }
                    },
                    error: (error) => {
                        this.sentry.captureException(error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete workspace',
                        });
                        console.error('Error deleting workspace:', error);
                    },
                });
            },
        });
    }
}

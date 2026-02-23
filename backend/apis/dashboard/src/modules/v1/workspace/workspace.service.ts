import { workspaceRepository } from './workspace.repo';
import { IWorkspace, IUserWorkspace, logger } from '@kyrazo/shared';
import { config } from '@/configs';
import { limitService } from '@/shared/services/limit.service';
import { mailQueues } from '@/producers/jobs/v1/publishers';
import { renderWorkspaceInvitationEmail } from '@/templates/emails';
import { subscriptionRepository } from '@/modules/billing/subscriptions/subscription.repo';
import { Types, unprefixId, mongoose } from '@kyrazo/shared';
import { snapshot } from '@/core/utils/transformers';
import { planRepository } from '@/modules/billing/plans/plan.repo';

export class WorkspaceService {
    async createWorkspace(userId: string, data: any): Promise<IWorkspace> {
        const existingWorkspace = await workspaceRepository.findOwnedWorkspace(userId);
        if (existingWorkspace) {
            throw new Error(
                'You already own a workspace. You can only own one workspace at a time.'
            );
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const workspaceData = {
                ...data,
                ownerId: userId,
            };

            const workspace = await workspaceRepository.createWorkspace(workspaceData, session);

            const workspaceIdRaw = unprefixId(workspace.id);
            const memberData = {
                userId: unprefixId(userId),
                workspaceId: workspaceIdRaw,
                role: 'owner',
                invitedBy: unprefixId(userId),
                invitationAcceptedAt: new Date(),
            };

            await workspaceRepository.createMembership(memberData, session);
            const plan = await planRepository.findBySlug('free');

            if (!plan) {
                logger.error('Free plan not found');
                throw new Error('System error: Registration failed');
            }

            const now = new Date();
            const addOneMonth = (date: Date) => {
                const d = new Date(date);
                d.setMonth(d.getMonth() + 1);
                return d;
            };

            await subscriptionRepository.create(
                {
                    workspaceId: new Types.ObjectId(workspaceIdRaw as string) as any,
                    userId: new Types.ObjectId(unprefixId(userId) as string),
                    planId: plan?._id,
                    planSnapshot: snapshot(plan),
                    status: 'active',
                    currentPeriodStart: now,
                    currentPeriodEnd: addOneMonth(now),
                    billingCycleAnchor: now,
                    quantity: 1,
                },
                session
            );

            await session.commitTransaction();
            return workspace;
        } catch (error) {
            await session.abortTransaction();
            logger.error('Workspace creation failed, transaction aborted:', error as Error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getWorkspaceById(id: string): Promise<IWorkspace | null> {
        return workspaceRepository.findById(id);
    }

    async getUserWorkspaces(userId: string): Promise<IUserWorkspace[]> {
        return workspaceRepository.findUserWorkspaces(userId);
    }

    async updateWorkspace(id: string, data: any): Promise<IWorkspace | null> {
        return workspaceRepository.updateWorkspace(id, data);
    }

    async deleteWorkspace(id: string): Promise<IWorkspace | null> {
        return workspaceRepository.softDeleteWorkspace(id);
    }

    async restoreWorkspace(id: string): Promise<IWorkspace | null> {
        const workspace = await this.getWorkspaceById(id);
        if (!workspace) return null;
        return workspaceRepository.restoreWorkspace(id);
    }

    async archiveWorkspace(id: string): Promise<boolean> {
        const workspace = await this.getWorkspaceById(id);
        if (!workspace) return false;
        await workspace.archive();
        return true;
    }

    async unarchiveWorkspace(id: string): Promise<boolean> {
        const workspace = await this.getWorkspaceById(id);
        if (!workspace) return false;
        await workspace.unarchive();
        return true;
    }

    async getWorkspaceMembers(workspaceId: string): Promise<IUserWorkspace[]> {
        return workspaceRepository.findMembers(workspaceId);
    }

    async inviteUser(
        inviterId: string,
        workspaceId: string,
        email: string,
        role: string,
        message?: string
    ): Promise<boolean> {
        const inviter = await workspaceRepository.findUserById(inviterId);
        if (!inviter) throw new Error('Inviter not found');

        const workspace = await workspaceRepository.findById(workspaceId);
        if (!workspace) throw new Error('Workspace not found');

        // Check limits
        const currentMembers = await workspaceRepository.countMembers(workspaceId);
        const pendingInvitations = await workspaceRepository.countPendingInvitations(workspaceId);
        const totalMembers = currentMembers + pendingInvitations;

        const canInvite = await limitService.checkLimit(workspaceId, 'maxMembers', totalMembers);
        if (!canInvite) throw new Error('Member limit exceeded for your current plan');

        // Check if user exists and is already member
        const user = await workspaceRepository.findUserByEmail(email);
        if (user) {
            const membership = await workspaceRepository.findMembership(
                workspaceId,
                user._id.toString()
            );
            if (membership) throw new Error('User is already a member of this workspace');
        }

        const invitation = await workspaceRepository.createInvitation(
            workspaceId,
            inviterId,
            email,
            role,
            message
        );

        // Send email
        try {
            const invitationUrl = `${config.app.frontendUrl}/invitation/${invitation.token}`;
            const recipientFirstName = user ? (user.firstName as string) : 'there';

            const body = renderWorkspaceInvitationEmail({
                firstName: recipientFirstName,
                email: email,
                workspaceName: workspace.name,
                inviterName: inviter.firstName as string,
                inviterEmail: inviter.email as string,
                invitationUrl,
                role,
                expiresAt: invitation.expiresAt.toISOString(),
                brandName: config.app.name,
                supportEmail: config.contacts.support || 'support@kyrazo.com',
            });

            await mailQueues.sendMailMediumPriorityQueue.add('medium-priority-mail', {
                to: email,
                subject: `You’ve been invited to ${config.app.name}`,
                html: body,
            });
        } catch (error) {
            logger.error('Failed to send invitation email:', error as Error);
            // We still created the invitation, so we return true but log the error
            // Or we could throw depending on UX preference
        }

        return true;
    }

    async acceptInvitation(userId: string, userEmail: string, token: string): Promise<boolean> {
        const invitation = await workspaceRepository.findInvitationByToken(token);
        if (!invitation || invitation.inviteeEmail !== userEmail) {
            throw new Error('Invitation token is invalid or expired');
        }

        const membership = await workspaceRepository.findMembership(
            invitation.workspaceId.toString(),
            userId
        );
        if (membership) throw new Error('User is already a member of this workspace');

        const memberData = {
            userId: userId,
            workspaceId: invitation.workspaceId,
            role: invitation.role,
            invitedBy: invitation.invitedBy,
            invitationAcceptedAt: new Date(),
        };

        await workspaceRepository.createMembership(memberData);
        await invitation.accept(userId);

        return true;
    }

    async rejectInvitation(userId: string, userEmail: string, token: string): Promise<boolean> {
        const invitation = await workspaceRepository.findInvitationByToken(token);
        if (!invitation || invitation.inviteeEmail !== userEmail) {
            throw new Error('Invitation token is invalid or expired');
        }

        await invitation.decline();
        return true;
    }

    async getInvitationByToken(token: string): Promise<any> {
        const invitation = await workspaceRepository.findInvitationByToken(token);
        if (!invitation) {
            throw new Error('Invitation not found');
        }

        if (invitation.status !== 'pending' || invitation.expiresAt < new Date()) {
            throw new Error('Invitation is no longer valid');
        }

        const workspace = await workspaceRepository.findById(invitation.workspaceId.toString());
        const inviter = await workspaceRepository.findUserById(invitation.invitedBy.toString());

        return {
            workspaceName: workspace?.name,
            inviterName: inviter?.firstName + ' ' + inviter?.lastName,
            email: invitation.inviteeEmail,
            role: invitation.role,
        };
    }

    async removeMember(workspaceId: string, userId: string): Promise<boolean> {
        return workspaceRepository.removeMember(workspaceId, userId);
    }

    async updateMemberRole(
        workspaceId: string,
        userId: string,
        role: string
    ): Promise<IUserWorkspace | null> {
        return workspaceRepository.updateMemberRole(workspaceId, userId, role);
    }
}

export const workspaceService = new WorkspaceService();

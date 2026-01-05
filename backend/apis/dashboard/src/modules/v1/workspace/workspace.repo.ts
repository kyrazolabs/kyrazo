import {
    IWorkspace,
    IUserWorkspace,
    IWorkspaceInvitation,
    Workspace,
    UserWorkspace,
    WorkspaceInvitation,
    User,
} from '@kyrazo/shared';
import { Types } from 'mongoose';

export class WorkspaceRepository {
    async findById(id: string): Promise<IWorkspace | null> {
        return Workspace.findById(id).populate('users');
    }

    async findOwnedWorkspace(ownerId: string): Promise<IWorkspace | null> {
        return Workspace.findOne({ ownerId, isDeleted: false });
    }

    async findUserWorkspaces(userId: string): Promise<IUserWorkspace[]> {
        return UserWorkspace.findByUser(userId);
    }

    async findMembers(workspaceId: string): Promise<IUserWorkspace[]> {
        return UserWorkspace.findByWorkspace(workspaceId);
    }

    async findMembership(
        workspaceId: string,
        userId: string
    ): Promise<IUserWorkspace | null> {
        return UserWorkspace.findOne({ workspaceId, userId });
    }

    async createWorkspace(data: any): Promise<IWorkspace> {
        const workspace = new Workspace(data);
        return workspace.save();
    }

    async createMembership(data: any): Promise<IUserWorkspace> {
        const userWorkspace = new UserWorkspace(data);
        return userWorkspace.save();
    }

    async updateWorkspace(id: string, data: any): Promise<IWorkspace | null> {
        return Workspace.findByIdAndUpdate(id, data, { new: true });
    }

    async softDeleteWorkspace(id: string): Promise<IWorkspace | null> {
        return Workspace.findByIdAndUpdate(
            id,
            {
                isDeleted: true,
                deletedAt: new Date(),
            },
            { new: true }
        );
    }

    async restoreWorkspace(id: string): Promise<IWorkspace | null> {
        return Workspace.findByIdAndUpdate(
            id,
            {
                isDeleted: false,
                $unset: { deletedAt: 1 },
            },
            { new: true }
        );
    }

    async countMembers(workspaceId: string): Promise<number> {
        return UserWorkspace.countDocuments({ workspaceId });
    }

    async countPendingInvitations(workspaceId: string): Promise<number> {
        return WorkspaceInvitation.countDocuments({
            workspaceId,
            invitationAcceptedAt: null,
        });
    }

    async findInvitationByToken(
        token: string
    ): Promise<IWorkspaceInvitation | null> {
        return WorkspaceInvitation.findByToken(token);
    }

    async createInvitation(
        workspaceId: string,
        invitedBy: string,
        email: string,
        role: string,
        message?: string
    ): Promise<IWorkspaceInvitation> {
        return WorkspaceInvitation.createInvitation(
            workspaceId,
            invitedBy,
            email,
            role as any,
            message
        );
    }

    async removeMember(workspaceId: string, userId: string): Promise<boolean> {
        const result = await UserWorkspace.deleteOne({ workspaceId, userId });
        return result.deletedCount > 0;
    }

    async updateMemberRole(
        workspaceId: string,
        userId: string,
        role: string
    ): Promise<IUserWorkspace | null> {
        return UserWorkspace.findOneAndUpdate(
            { workspaceId, userId },
            { role },
            { new: true }
        );
    }

    async findUserByEmail(email: string): Promise<any | null> {
        return User.findOne({ email });
    }

    async findUserById(id: string): Promise<any | null> {
        return User.findById(id);
    }
}

export const workspaceRepository = new WorkspaceRepository();

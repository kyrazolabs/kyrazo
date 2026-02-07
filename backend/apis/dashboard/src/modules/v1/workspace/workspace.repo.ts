import {
    IWorkspace,
    IUserWorkspace,
    IWorkspaceInvitation,
    Workspace,
    UserWorkspace,
    WorkspaceInvitation,
    User,
    transformWithId,
    unprefixId,
} from '@kyrazo/shared';

export class WorkspaceRepository {
    async findById(id: string): Promise<IWorkspace | null> {
        const workspace = await Workspace.findById(unprefixId(id)).populate('users').lean();
        return workspace ? (transformWithId(workspace, 'workspace') as any) : null;
    }

    async findOwnedWorkspace(ownerId: string): Promise<IWorkspace | null> {
        const workspace = await Workspace.findOne({ ownerId, isDeleted: false }).lean();
        return workspace ? (transformWithId(workspace, 'workspace') as any) : null;
    }

    async findUserWorkspaces(userId: string): Promise<IUserWorkspace[]> {
        const workspaces = await UserWorkspace.find({ userId: unprefixId(userId) })
            .populate('workspace')
            .lean();
        return transformWithId(workspaces, 'userWorkspace') as any;
    }

    async findMembers(workspaceId: string): Promise<IUserWorkspace[]> {
        const members = await UserWorkspace.find({ workspaceId: unprefixId(workspaceId) })
            .populate('user')
            .lean();
        return transformWithId(members, 'userWorkspace') as any;
    }

    async findMembership(workspaceId: string, userId: string): Promise<IUserWorkspace | null> {
        const membership = await UserWorkspace.findOne({
            workspaceId: unprefixId(workspaceId),
            userId: unprefixId(userId),
        }).lean();
        return membership ? (transformWithId(membership, 'userWorkspace') as any) : null;
    }

    async createWorkspace(data: any): Promise<IWorkspace> {
        const workspace = new Workspace(data);
        const saved = await workspace.save();
        return transformWithId(saved.toJSON(), 'workspace') as any;
    }

    async createMembership(data: any): Promise<IUserWorkspace> {
        const userWorkspace = new UserWorkspace(data);
        const saved = await userWorkspace.save();
        return transformWithId(saved.toJSON(), 'userWorkspace') as any;
    }

    async updateWorkspace(id: string, data: any): Promise<IWorkspace | null> {
        const workspace = await Workspace.findByIdAndUpdate(unprefixId(id), data, {
            new: true,
        }).lean();
        return workspace ? (transformWithId(workspace, 'workspace') as any) : null;
    }

    async softDeleteWorkspace(id: string): Promise<IWorkspace | null> {
        const workspace = await Workspace.findByIdAndUpdate(
            unprefixId(id),
            {
                isDeleted: true,
                deletedAt: new Date(),
            },
            { new: true }
        ).lean();
        return workspace ? (transformWithId(workspace, 'workspace') as any) : null;
    }

    async restoreWorkspace(id: string): Promise<IWorkspace | null> {
        const workspace = await Workspace.findByIdAndUpdate(
            unprefixId(id),
            {
                isDeleted: false,
                $unset: { deletedAt: 1 },
            },
            { new: true }
        ).lean();
        return workspace ? (transformWithId(workspace, 'workspace') as any) : null;
    }

    async countMembers(workspaceId: string): Promise<number> {
        return UserWorkspace.countDocuments({ workspaceId: unprefixId(workspaceId) });
    }

    async countPendingInvitations(workspaceId: string): Promise<number> {
        return WorkspaceInvitation.countDocuments({
            workspaceId,
            invitationAcceptedAt: null,
        });
    }

    async findInvitationByToken(token: string): Promise<IWorkspaceInvitation | null> {
        const invitation = await WorkspaceInvitation.findByToken(token);
        return invitation
            ? (transformWithId((invitation as any).toJSON(), 'workspaceInvitation') as any)
            : null;
    }

    async createInvitation(
        workspaceId: string,
        invitedBy: string,
        email: string,
        role: string,
        message?: string
    ): Promise<IWorkspaceInvitation> {
        const invitation = await WorkspaceInvitation.createInvitation(
            workspaceId,
            invitedBy,
            email,
            role as any,
            message
        );
        return transformWithId((invitation as any).toJSON(), 'workspaceInvitation') as any;
    }

    async removeMember(workspaceId: string, userId: string): Promise<boolean> {
        const result = await UserWorkspace.deleteOne({
            workspaceId: unprefixId(workspaceId),
            userId: unprefixId(userId),
        });
        return result.deletedCount > 0;
    }

    async updateMemberRole(
        workspaceId: string,
        userId: string,
        role: string
    ): Promise<IUserWorkspace | null> {
        return UserWorkspace.findOneAndUpdate(
            { workspaceId: unprefixId(workspaceId), userId: unprefixId(userId) },
            { role },
            { new: true }
        );
    }

    async findUserByEmail(email: string): Promise<any | null> {
        return User.findOne({ email });
    }

    async findUserById(id: string): Promise<any | null> {
        return User.findById(unprefixId(id));
    }
}

export const workspaceRepository = new WorkspaceRepository();

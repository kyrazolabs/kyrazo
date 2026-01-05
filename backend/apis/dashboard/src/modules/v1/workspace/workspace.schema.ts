import z from 'zod';

const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const workspaceRoleSchema = z.enum(['owner', 'admin', 'member', 'viewer']);
const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/i, 'Invalid token');

export const CreateWorkspaceSchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters long')
        .max(100, 'Name is too long')
        .trim(),
    description: z
        .string()
        .max(2000, 'Description is too long')
        .optional()
        .nullable(),
});

export const UpdateWorkspaceSchema = CreateWorkspaceSchema.partial();

export const InviteWorkspaceMemberSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email format')
        .regex(emailRegex, 'Invalid email format'),
    message: z.string().max(2000, 'Description is too long').optional(),
    role: workspaceRoleSchema,
});

export const GetWorkspaceByIdSchema = z.object({
    workspaceId: objectIdSchema,
});
export const UpdateWorkspaceMemberRoleSchema = InviteWorkspaceMemberSchema.pick(
    { role: true }
).extend({ userId: objectIdSchema });
export const UpdateInvitationStatusSchema = z.object({ token: tokenSchema });
export const WorkspaceMemberSchema = GetWorkspaceByIdSchema.extend({
    userId: objectIdSchema,
});

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceSchema>;
export type WorkspaceMemberInput = z.infer<typeof WorkspaceMemberSchema>;
export type GetWorkspaceByIdInput = z.infer<typeof GetWorkspaceByIdSchema>;
export type InviteWorkspaceMemberInput = z.infer<
    typeof InviteWorkspaceMemberSchema
>;
export type UpdateInvitationStatusInput = z.infer<
    typeof UpdateInvitationStatusSchema
>;
export type UpdateWorkspaceMemberRoleInput = z.infer<
    typeof UpdateWorkspaceMemberRoleSchema
>;

export type WorkspaceRoleEnum = z.infer<typeof workspaceRoleSchema>;

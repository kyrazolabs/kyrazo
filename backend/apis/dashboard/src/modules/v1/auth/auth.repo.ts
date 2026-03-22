import {
    IUser,
    User,
    User2FA,
    RefreshToken,
    UserPreference,
    unprefixId,
    transformWithId,
} from '@kyrazo/shared';

export class AuthRepository {
    private _transformUser(user: any): IUser | null {
        if (!user) return null;
        const transformed = transformWithId(user, 'user') as any;
        if (transformed) {
            delete transformed.passwordHash;
            delete transformed.emailVerificationToken;
            delete transformed.__v;
        }
        return transformed;
    }

    async findUserByEmail(
        email: string,
        includePasswordHash: boolean = false
    ): Promise<IUser | null> {
        const query = User.findOne({ email: email.toLowerCase() });
        if (includePasswordHash) {
            query.select('+passwordHash');
        }
        const user = await query.lean();
        return this._transformUser(user);
    }

    async findUser2FA(userId: string, includeSecret: boolean = false) {
        let query = User2FA.findOne({ userId: unprefixId(userId) });
        if (includeSecret) {
            query = query.select('+secret +backupCodes');
        }
        return await query;
    }

    async findEnabledUser2FA(userId: string, includeSecret: boolean = false) {
        let query = User2FA.findOne({ userId: unprefixId(userId), isEnabled: true });
        if (includeSecret) {
            query = query.select('+secret +backupCodes');
        }
        return await query;
    }

    async upsertUser2FA(userId: string, data: any) {
        return await User2FA.findOneAndUpdate(
            { userId: unprefixId(userId) },
            { ...data, userId: unprefixId(userId) },
            { upsert: true, new: true }
        );
    }

    async createUser(data: any): Promise<IUser> {
        const user = new User(data);
        const saved = await user.save();
        return this._transformUser(saved.toObject()) as IUser;
    }

    async createRefreshToken(data: any): Promise<any> {
        const refreshToken = new RefreshToken(data);
        return await refreshToken.save();
    }

    async createUserPreference(data: any): Promise<any> {
        const preference = new UserPreference(data);
        return await preference.save();
    }

    async updatePassword(id: string, newPassword: string): Promise<void> {
        const user = await User.findById(unprefixId(id));
        if (!user) throw new Error('User not found');
        user.passwordHash = newPassword;
        await user.save();
    }

    async comparePassword(userId: string, candidate: string): Promise<boolean> {
        const user = await User.findById(unprefixId(userId)).select('+passwordHash');
        if (!user) return false;
        return await user.comparePassword(candidate);
    }

    async findUserByVerificationToken(token: string): Promise<IUser | null> {
        const user = await User.findOne({ emailVerificationToken: token }).lean();
        return this._transformUser(user);
    }

    async verifyUserEmail(userId: string): Promise<void> {
        await User.updateOne(
            { _id: unprefixId(userId) },
            {
                $set: { emailVerified: true },
                $unset: { emailVerificationToken: '' },
            }
        );
    }

    async updateVerificationToken(userId: string, token: string): Promise<void> {
        await User.updateOne(
            { _id: unprefixId(userId) },
            { $set: { emailVerificationToken: token } }
        );
    }

    async updateLastLogin(id: string): Promise<void> {
        await User.updateOne({ _id: unprefixId(id) }, { $set: { lastLogin: new Date() } });
    }

    async findRefreshTokenByToken(token: string): Promise<any> {
        return await RefreshToken.findOne({
            token,
            isRevoked: false,
            expiresAt: { $gt: new Date() },
        }).lean();
    }

    async revokeRefreshToken(token: string): Promise<any> {
        return await RefreshToken.findOneAndUpdate(
            { token },
            { $set: { isRevoked: true } },
            { new: true }
        );
    }

    async revokeAllUserRefreshTokens(userId: string): Promise<any> {
        return await RefreshToken.updateMany(
            { userId: unprefixId(userId), isRevoked: false },
            { $set: { isRevoked: true } }
        );
    }

    async findRefreshToken(token: string): Promise<any> {
        return await RefreshToken.findOne({ token }).lean();
    }
}

export const authRepository = new AuthRepository();

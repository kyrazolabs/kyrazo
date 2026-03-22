import { IUser, transformWithId, unprefixId, User, UserPreference } from '@kyrazo/shared';

export class ProfileRepository {
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
    async findUserById(id: string, includePasswordHash: boolean = false): Promise<IUser | null> {
        const query = User.findById(unprefixId(id));
        if (includePasswordHash) {
            query.select('+passwordHash');
        }
        const user = await query.lean();
        return this._transformUser(user);
    }

    async updateUser(id: string, data: any): Promise<IUser | null> {
        const user = await User.findByIdAndUpdate(unprefixId(id), data, {
            new: true,
        }).lean();
        return this._transformUser(user);
    }

    async createUserPreference(data: any): Promise<any> {
        const preference = new UserPreference(data);
        return await preference.save();
    }

    async getUserPreference(userId: string): Promise<any | null> {
        return await UserPreference.findOne({ userId: unprefixId(userId) }).lean();
    }

    async updateUserPreference(userId: string, data: any): Promise<any> {
        return await UserPreference.findOneAndUpdate(
            { userId: unprefixId(userId) },
            { $set: data },
            { upsert: true, new: true }
        );
    }
}

export const profileRepository = new ProfileRepository();

import { IUser, IUserPreferences } from '../types';
export declare class UserService {
    static getProfile(userId: string): Promise<{
        user: IUser;
        preferences: IUserPreferences;
    }>;
    static updateProfile(userId: string, payload: Partial<IUser>): Promise<IUser>;
    static updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    static deleteAccount(userId: string, password: string): Promise<{
        message: string;
    }>;
    static uploadProfileImage(userId: string, file: Express.Multer.File): Promise<{
        imageUrl: string;
        user: IUser;
    }>;
    static deleteProfileImage(userId: string): Promise<{
        message: string;
    }>;
    static exportUserData(userId: string): Promise<{
        exportId: string;
        data: any;
        message: string;
    }>;
}
export default UserService;
//# sourceMappingURL=userService.d.ts.map
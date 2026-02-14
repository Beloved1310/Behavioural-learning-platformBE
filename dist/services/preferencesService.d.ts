import { IUserPreferences } from '../types';
export declare class PreferencesService {
    /**
     * Get user preferences, create default if none exist
     */
    getPreferences(userId: string): Promise<IUserPreferences>;
    /**
     * Update user preferences
     */
    updatePreferences(userId: string, updates: Partial<IUserPreferences>): Promise<IUserPreferences>;
    /**
     * Reset preferences to default
     */
    resetPreferences(userId: string): Promise<IUserPreferences>;
}
declare const _default: PreferencesService;
export default _default;
//# sourceMappingURL=preferencesService.d.ts.map
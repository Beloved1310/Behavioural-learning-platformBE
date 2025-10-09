"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userPreferencesRepository = void 0;
const UserPreferences_1 = require("../models/UserPreferences");
const BaseRepository_1 = require("./BaseRepository");
/**
 * UserPreferences Repository
 * Handles database operations for user preferences
 */
class UserPreferencesRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(UserPreferences_1.UserPreferences);
    }
    /**
     * Find preferences by user ID
     */
    async findByUserId(userId) {
        return await this.findOne({ userId });
    }
    /**
     * Update preferences by user ID
     */
    async updateByUserId(userId, updates) {
        return await this.updateOne({ userId }, updates);
    }
    /**
     * Delete preferences by user ID
     */
    async deleteByUserId(userId) {
        return await this.deleteOne({ userId });
    }
}
// Export singleton instance
exports.userPreferencesRepository = new UserPreferencesRepository();
exports.default = exports.userPreferencesRepository;
//# sourceMappingURL=UserPreferencesRepository.js.map
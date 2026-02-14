"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userBadgeRepository = void 0;
const mongoose_1 = require("mongoose");
const UserBadge_1 = require("../models/UserBadge");
const BaseRepository_1 = require("./BaseRepository");
class UserBadgeRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(UserBadge_1.UserBadge);
    }
    async findForUser(userId) {
        return UserBadge_1.UserBadge
            .find({ userId: new mongoose_1.Types.ObjectId(userId) })
            .populate('badgeId')
            .sort({ earnedAt: -1 });
    }
}
exports.userBadgeRepository = new UserBadgeRepository();
exports.default = exports.userBadgeRepository;
//# sourceMappingURL=UserBadgeRepository.js.map
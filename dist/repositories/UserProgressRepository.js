"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userProgressRepository = void 0;
const mongoose_1 = require("mongoose");
const UserProgress_1 = require("../models/UserProgress");
const BaseRepository_1 = require("./BaseRepository");
class UserProgressRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(UserProgress_1.UserProgress);
    }
    async findByUser(userId) {
        return this.find({ userId: new mongoose_1.Types.ObjectId(userId) }, {
            sort: { subject: 1 },
        });
    }
    async findByUserAndSubject(userId, subject) {
        return this.findOne({
            userId: new mongoose_1.Types.ObjectId(userId),
            subject,
        });
    }
}
exports.userProgressRepository = new UserProgressRepository();
exports.default = exports.userProgressRepository;
//# sourceMappingURL=UserProgressRepository.js.map
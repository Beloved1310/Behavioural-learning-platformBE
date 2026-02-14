"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.badgeRepository = void 0;
const Badge_1 = require("../models/Badge");
const BaseRepository_1 = require("./BaseRepository");
class BadgeRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(Badge_1.Badge);
    }
    async findActive() {
        return this.find({ isActive: true }, {
            sort: { rarity: 1, pointsReward: 1 },
        });
    }
}
exports.badgeRepository = new BadgeRepository();
exports.default = exports.badgeRepository;
//# sourceMappingURL=BadgeRepository.js.map
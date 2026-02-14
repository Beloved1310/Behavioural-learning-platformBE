"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.behavioralDataRepository = void 0;
const mongoose_1 = require("mongoose");
const BehavioralData_1 = require("../models/BehavioralData");
const BaseRepository_1 = require("./BaseRepository");
class BehavioralDataRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(BehavioralData_1.BehavioralData);
    }
    async findSince(userId, startDate) {
        return this.find({
            userId: new mongoose_1.Types.ObjectId(userId),
            timestamp: { $gte: startDate },
        });
    }
}
exports.behavioralDataRepository = new BehavioralDataRepository();
exports.default = exports.behavioralDataRepository;
//# sourceMappingURL=BehavioralDataRepository.js.map
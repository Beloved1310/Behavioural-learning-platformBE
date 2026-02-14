"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.progressReportRepository = void 0;
const mongoose_1 = require("mongoose");
const ProgressReport_1 = require("../models/ProgressReport");
const BaseRepository_1 = require("./BaseRepository");
class ProgressReportRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(ProgressReport_1.ProgressReport);
    }
    async findForUser(userId, period, limit) {
        const filter = { studentId: new mongoose_1.Types.ObjectId(userId) };
        if (period)
            filter.period = period;
        return this.find(filter, { sort: { generatedAt: -1 }, limit });
    }
}
exports.progressReportRepository = new ProgressReportRepository();
exports.default = exports.progressReportRepository;
//# sourceMappingURL=ProgressReportRepository.js.map
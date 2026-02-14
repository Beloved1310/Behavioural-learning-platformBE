"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customEventRepository = void 0;
const mongoose_1 = require("mongoose");
const CustomEvent_1 = require("../models/CustomEvent");
const BaseRepository_1 = require("./BaseRepository");
class CustomEventRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(CustomEvent_1.CustomEvent);
    }
    async createEvent(data) {
        return this.create(data);
    }
    async getHistory(userId, eventType, limit) {
        const filter = { userId: new mongoose_1.Types.ObjectId(userId) };
        if (eventType)
            filter.eventType = eventType;
        return this.find(filter, { sort: { timestamp: -1 }, limit });
    }
    async getCounts(userId, days) {
        return CustomEvent_1.CustomEvent.getEventCounts(userId, days);
    }
    async getPageViews(userId, days) {
        return CustomEvent_1.CustomEvent.getPageViews(userId, days);
    }
}
exports.customEventRepository = new CustomEventRepository();
exports.default = exports.customEventRepository;
//# sourceMappingURL=CustomEventRepository.js.map
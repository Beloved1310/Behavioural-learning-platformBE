"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tutorAvailabilityRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const TutorAvailability_1 = require("../models/TutorAvailability");
const mongoose_1 = require("mongoose");
class TutorAvailabilityRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(TutorAvailability_1.TutorAvailability);
    }
    async findByTutor(tutorId, activeOnly = true) {
        const filter = { tutorId: new mongoose_1.Types.ObjectId(tutorId) };
        if (activeOnly) {
            filter.isActive = true;
        }
        return this.model.find(filter).sort({ dayOfWeek: 1, startTime: 1 });
    }
    async findByTutorAndDay(tutorId, dayOfWeek, activeOnly = true) {
        const filter = {
            tutorId: new mongoose_1.Types.ObjectId(tutorId),
            dayOfWeek,
        };
        if (activeOnly) {
            filter.isActive = true;
        }
        return this.find(filter, { sort: { startTime: 1 } });
    }
    async findByTutorAndDate(tutorId, date) {
        const dayOfWeek = date.getDay();
        const filter = {
            tutorId: new mongoose_1.Types.ObjectId(tutorId),
            $or: [
                { isRecurring: true, dayOfWeek, isActive: true },
                { specificDate: date, isActive: true },
            ],
        };
        return this.find(filter, { sort: { startTime: 1 } });
    }
    async deleteByTutor(tutorId) {
        return this.model.deleteMany({ tutorId: new mongoose_1.Types.ObjectId(tutorId) });
    }
}
exports.tutorAvailabilityRepository = new TutorAvailabilityRepository();
exports.default = exports.tutorAvailabilityRepository;
//# sourceMappingURL=TutorAvailabilityRepository.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lessonRepository = void 0;
const Lesson_1 = require("../models/Lesson");
const BaseRepository_1 = require("./BaseRepository");
class LessonRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(Lesson_1.Lesson);
    }
    /**
     * Find active lessons by subject
     */
    async findBySubject(subject) {
        return await this.find({ subject, isActive: true });
    }
    /**
     * Find active lessons by subject and topic
     */
    async findBySubjectAndTopic(subject, topic) {
        return await this.find({
            subject,
            topic,
            isActive: true
        });
    }
    /**
     * Find active lesson by ID
     */
    async findActiveById(id) {
        return await this.findOne({ _id: id, isActive: true });
    }
    /**
     * Get all active lessons
     */
    async findActive(filters) {
        return await this.find({ ...filters, isActive: true });
    }
}
exports.lessonRepository = new LessonRepository();
exports.default = exports.lessonRepository;
//# sourceMappingURL=LessonRepository.js.map
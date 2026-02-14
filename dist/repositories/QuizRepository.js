"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quizRepository = void 0;
const Quiz_1 = require("../models/Quiz");
const BaseRepository_1 = require("./BaseRepository");
class QuizRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(Quiz_1.Quiz);
    }
    async findActive(filter = {}) {
        return this.find({ isActive: true, ...filter }, {
            sort: { createdAt: -1 },
        });
    }
    async findActiveById(id) {
        return this.findOne({ _id: id, isActive: true });
    }
}
exports.quizRepository = new QuizRepository();
exports.default = exports.quizRepository;
//# sourceMappingURL=QuizRepository.js.map
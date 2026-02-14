"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refundRequestRepository = void 0;
const mongoose_1 = require("mongoose");
const RefundRequest_1 = __importDefault(require("../models/RefundRequest"));
const BaseRepository_1 = require("./BaseRepository");
class RefundRequestRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(RefundRequest_1.default);
    }
    async findByUserId(userId) {
        return RefundRequest_1.default
            .find({ userId: new mongoose_1.Types.ObjectId(userId) })
            .populate('paymentId', 'amount description createdAt')
            .sort({ createdAt: -1 });
    }
    async findByPaymentId(paymentId) {
        return this.findOne({ paymentId: new mongoose_1.Types.ObjectId(paymentId) });
    }
    async findByIdWithPayment(id) {
        return RefundRequest_1.default.findById(new mongoose_1.Types.ObjectId(id)).populate('paymentId');
    }
}
exports.refundRequestRepository = new RefundRequestRepository();
exports.default = exports.refundRequestRepository;
//# sourceMappingURL=RefundRequestRepository.js.map
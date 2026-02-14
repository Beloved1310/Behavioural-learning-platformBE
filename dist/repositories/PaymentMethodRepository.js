"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentMethodRepository = void 0;
const mongoose_1 = require("mongoose");
const PaymentMethod_1 = __importDefault(require("../models/PaymentMethod"));
const BaseRepository_1 = require("./BaseRepository");
class PaymentMethodRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(PaymentMethod_1.default);
    }
    async findActiveByUserId(userId) {
        return PaymentMethod_1.default
            .find({ userId: new mongoose_1.Types.ObjectId(userId), isActive: true })
            .sort({ isDefault: -1, createdAt: -1 });
    }
    async findByIdAndUserId(id, userId) {
        return this.findOne({ _id: new mongoose_1.Types.ObjectId(id), userId: new mongoose_1.Types.ObjectId(userId) });
    }
    async removeDefaultForUser(userId) {
        return PaymentMethod_1.default.updateMany({ userId: new mongoose_1.Types.ObjectId(userId) }, { isDefault: false });
    }
}
exports.paymentMethodRepository = new PaymentMethodRepository();
exports.default = exports.paymentMethodRepository;
//# sourceMappingURL=PaymentMethodRepository.js.map
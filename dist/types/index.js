"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadgeType = exports.MessageType = exports.PaymentStatus = exports.SessionStatus = exports.SubscriptionTier = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["STUDENT"] = "STUDENT";
    UserRole["TUTOR"] = "TUTOR";
    UserRole["PARENT"] = "PARENT";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var SubscriptionTier;
(function (SubscriptionTier) {
    SubscriptionTier["BASIC"] = "BASIC";
    SubscriptionTier["PREMIUM"] = "PREMIUM";
})(SubscriptionTier || (exports.SubscriptionTier = SubscriptionTier = {}));
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["SCHEDULED"] = "SCHEDULED";
    SessionStatus["IN_PROGRESS"] = "IN_PROGRESS";
    SessionStatus["COMPLETED"] = "COMPLETED";
    SessionStatus["CANCELLED"] = "CANCELLED";
    SessionStatus["NO_SHOW"] = "NO_SHOW";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["COMPLETED"] = "COMPLETED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "TEXT";
    MessageType["FILE"] = "FILE";
    MessageType["IMAGE"] = "IMAGE";
    MessageType["SYSTEM"] = "SYSTEM";
})(MessageType || (exports.MessageType = MessageType = {}));
var BadgeType;
(function (BadgeType) {
    BadgeType["STREAK"] = "STREAK";
    BadgeType["COMPLETION"] = "COMPLETION";
    BadgeType["ACHIEVEMENT"] = "ACHIEVEMENT";
    BadgeType["MILESTONE"] = "MILESTONE";
})(BadgeType || (exports.BadgeType = BadgeType = {}));
//# sourceMappingURL=index.js.map
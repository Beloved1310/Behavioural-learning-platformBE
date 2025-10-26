"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizDifficulty = exports.BadgeRarity = exports.BadgeCategory = exports.BadgeType = exports.MessageType = exports.RefundStatus = exports.PaymentMethodType = exports.SubscriptionStatus = exports.PaymentStatus = exports.RecurringPattern = exports.SessionType = exports.SessionStatus = exports.SubscriptionTier = exports.UserRole = void 0;
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
    SessionStatus["SCHEDULED"] = "scheduled";
    SessionStatus["IN_PROGRESS"] = "in_progress";
    SessionStatus["COMPLETED"] = "completed";
    SessionStatus["CANCELLED"] = "cancelled";
    SessionStatus["MISSED"] = "missed";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
var SessionType;
(function (SessionType) {
    SessionType["STUDY"] = "study";
    SessionType["TUTORING"] = "tutoring";
    SessionType["QUIZ"] = "quiz";
    SessionType["READING"] = "reading";
})(SessionType || (exports.SessionType = SessionType = {}));
var RecurringPattern;
(function (RecurringPattern) {
    RecurringPattern["DAILY"] = "daily";
    RecurringPattern["WEEKLY"] = "weekly";
    RecurringPattern["MONTHLY"] = "monthly";
})(RecurringPattern || (exports.RecurringPattern = RecurringPattern = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["COMPLETED"] = "completed";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
    PaymentStatus["CANCELLED"] = "cancelled";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["CANCELLED"] = "cancelled";
    SubscriptionStatus["PAST_DUE"] = "past_due";
    SubscriptionStatus["EXPIRED"] = "expired";
    SubscriptionStatus["TRIALING"] = "trialing";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var PaymentMethodType;
(function (PaymentMethodType) {
    PaymentMethodType["CARD"] = "card";
    PaymentMethodType["BANK_ACCOUNT"] = "bank_account";
    PaymentMethodType["PAYPAL"] = "paypal";
})(PaymentMethodType || (exports.PaymentMethodType = PaymentMethodType = {}));
var RefundStatus;
(function (RefundStatus) {
    RefundStatus["PENDING"] = "pending";
    RefundStatus["APPROVED"] = "approved";
    RefundStatus["REJECTED"] = "rejected";
    RefundStatus["PROCESSED"] = "processed";
})(RefundStatus || (exports.RefundStatus = RefundStatus = {}));
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
var BadgeCategory;
(function (BadgeCategory) {
    BadgeCategory["QUIZ"] = "quiz";
    BadgeCategory["STREAK"] = "streak";
    BadgeCategory["ACHIEVEMENT"] = "achievement";
    BadgeCategory["SPECIAL"] = "special";
})(BadgeCategory || (exports.BadgeCategory = BadgeCategory = {}));
var BadgeRarity;
(function (BadgeRarity) {
    BadgeRarity["COMMON"] = "common";
    BadgeRarity["RARE"] = "rare";
    BadgeRarity["EPIC"] = "epic";
    BadgeRarity["LEGENDARY"] = "legendary";
})(BadgeRarity || (exports.BadgeRarity = BadgeRarity = {}));
var QuizDifficulty;
(function (QuizDifficulty) {
    QuizDifficulty["EASY"] = "easy";
    QuizDifficulty["MEDIUM"] = "medium";
    QuizDifficulty["HARD"] = "hard";
})(QuizDifficulty || (exports.QuizDifficulty = QuizDifficulty = {}));
//# sourceMappingURL=index.js.map
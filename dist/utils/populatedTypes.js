"use strict";
/**
 * Type utilities for handling populated Mongoose documents
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPopulated = isPopulated;
exports.toObjectId = toObjectId;
exports.toObjectIdString = toObjectIdString;
exports.isPopulatedUser = isPopulatedUser;
const mongoose_1 = require("mongoose");
/**
 * Check if a value is a populated document (has _id property)
 */
function isPopulated(value) {
    return typeof value === 'object' && value !== null && '_id' in value;
}
/**
 * Safely get ObjectId from a value that might be populated or an ObjectId
 */
function toObjectId(value) {
    if (!value)
        return undefined;
    if (value instanceof mongoose_1.Types.ObjectId)
        return value;
    if (typeof value === 'string')
        return new mongoose_1.Types.ObjectId(value);
    if (isPopulated(value))
        return value._id;
    return undefined;
}
/**
 * Safely get ObjectId string from a value that might be populated or an ObjectId
 */
function toObjectIdString(value) {
    const objectId = toObjectId(value);
    return objectId?.toString();
}
function isPopulatedUser(value) {
    return (typeof value === 'object' &&
        value !== null &&
        '_id' in value &&
        'firstName' in value &&
        'lastName' in value);
}
//# sourceMappingURL=populatedTypes.js.map
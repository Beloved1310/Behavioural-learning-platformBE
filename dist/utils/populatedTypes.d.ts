/**
 * Type utilities for handling populated Mongoose documents
 */
import { Types, Document } from 'mongoose';
/**
 * Check if a value is a populated document (has _id property)
 */
export declare function isPopulated<T extends Document>(value: T | Types.ObjectId | string): value is T & {
    _id: Types.ObjectId;
};
/**
 * Safely get ObjectId from a value that might be populated or an ObjectId
 */
export declare function toObjectId(value: Types.ObjectId | Document | string | undefined): Types.ObjectId | undefined;
/**
 * Safely get ObjectId string from a value that might be populated or an ObjectId
 */
export declare function toObjectIdString(value: Types.ObjectId | Document | string | undefined): string | undefined;
/**
 * Type guard for populated user document
 */
export interface PopulatedUser {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    profileImage?: string;
    email?: string;
}
export declare function isPopulatedUser(value: unknown): value is PopulatedUser;
//# sourceMappingURL=populatedTypes.d.ts.map
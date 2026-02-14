/**
 * Type utilities for handling populated Mongoose documents
 */

import { Types, Document } from 'mongoose';

/**
 * Check if a value is a populated document (has _id property)
 */
export function isPopulated<T extends Document>(
  value: T | Types.ObjectId | string
): value is T & { _id: Types.ObjectId } {
  return typeof value === 'object' && value !== null && '_id' in value;
}

/**
 * Safely get ObjectId from a value that might be populated or an ObjectId
 */
export function toObjectId(
  value: Types.ObjectId | Document | string | undefined
): Types.ObjectId | undefined {
  if (!value) return undefined;
  if (value instanceof Types.ObjectId) return value;
  if (typeof value === 'string') return new Types.ObjectId(value);
  if (isPopulated(value)) return value._id;
  return undefined;
}

/**
 * Safely get ObjectId string from a value that might be populated or an ObjectId
 */
export function toObjectIdString(
  value: Types.ObjectId | Document | string | undefined
): string | undefined {
  const objectId = toObjectId(value);
  return objectId?.toString();
}

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

export function isPopulatedUser(value: unknown): value is PopulatedUser {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_id' in value &&
    'firstName' in value &&
    'lastName' in value
  );
}


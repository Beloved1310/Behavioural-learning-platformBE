import { Model, Document, FilterQuery, UpdateQuery, QueryOptions, SortOrder } from 'mongoose';
export interface PaginationOptions {
    page?: number;
    limit?: number;
    sort?: {
        [key: string]: SortOrder;
    };
}
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
/**
 * Base Repository class implementing common CRUD operations
 * @template T - The document type extending mongoose Document
 */
export declare abstract class BaseRepository<T extends Document> {
    protected model: Model<T>;
    constructor(model: Model<T>);
    /**
     * Create a new document
     */
    create(data: Partial<T>): Promise<T>;
    /**
     * Create multiple documents
     */
    createMany(data: Partial<T>[]): Promise<T[]>;
    /**
     * Find a single document by filter
     */
    findOne(filter: FilterQuery<T>, options?: QueryOptions): Promise<T | null>;
    /**
     * Find a document by ID
     */
    findById(id: string, options?: QueryOptions): Promise<T | null>;
    /**
     * Find multiple documents
     */
    find(filter?: FilterQuery<T>, options?: QueryOptions): Promise<T[]>;
    /**
     * Find documents with pagination
     */
    findPaginated(filter?: FilterQuery<T>, paginationOptions?: PaginationOptions): Promise<PaginatedResult<T>>;
    /**
     * Update a single document
     */
    updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>, options?: QueryOptions): Promise<T | null>;
    /**
     * Update a document by ID
     */
    updateById(id: string, update: UpdateQuery<T>, options?: QueryOptions): Promise<T | null>;
    /**
     * Update multiple documents
     */
    updateMany(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<{
        matchedCount: number;
        modifiedCount: number;
    }>;
    /**
     * Increment a field value
     */
    increment(filter: FilterQuery<T>, field: string, value?: number): Promise<T | null>;
    /**
     * Decrement a field value
     */
    decrement(filter: FilterQuery<T>, field: string, value?: number): Promise<T | null>;
    /**
     * Delete a single document
     */
    deleteOne(filter: FilterQuery<T>): Promise<T | null>;
    /**
     * Delete a document by ID
     */
    deleteById(id: string): Promise<T | null>;
    /**
     * Delete multiple documents
     */
    deleteMany(filter: FilterQuery<T>): Promise<number>;
    /**
     * Count documents
     */
    count(filter?: FilterQuery<T>): Promise<number>;
    /**
     * Check if document exists
     */
    exists(filter: FilterQuery<T>): Promise<boolean>;
    /**
     * Find documents and return distinct values for a field
     */
    distinct(field: string, filter?: FilterQuery<T>): Promise<any[]>;
    /**
     * Aggregate data
     */
    aggregate(pipeline: any[]): Promise<any[]>;
}
//# sourceMappingURL=BaseRepository.d.ts.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
/**
 * Base Repository class implementing common CRUD operations
 * @template T - The document type extending mongoose Document
 */
class BaseRepository {
    constructor(model) {
        this.model = model;
    }
    /**
     * Create a new document
     */
    async create(data) {
        return await this.model.create(data);
    }
    /**
     * Create multiple documents
     */
    async createMany(data) {
        return await this.model.insertMany(data);
    }
    /**
     * Find a single document by filter
     */
    async findOne(filter, options) {
        return await this.model.findOne(filter, null, options);
    }
    /**
     * Find a document by ID
     */
    async findById(id, options) {
        return await this.model.findById(id, null, options);
    }
    /**
     * Find multiple documents
     */
    async find(filter = {}, options) {
        return await this.model.find(filter, null, options);
    }
    /**
     * Find documents with pagination
     */
    async findPaginated(filter = {}, paginationOptions = {}) {
        const { page = 1, limit = 10, sort = { createdAt: -1 } } = paginationOptions;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.model.find(filter).sort(sort).skip(skip).limit(limit),
            this.model.countDocuments(filter),
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    /**
     * Update a single document
     */
    async updateOne(filter, update, options) {
        return await this.model.findOneAndUpdate(filter, update, {
            new: true,
            runValidators: true,
            ...options,
        });
    }
    /**
     * Update a document by ID
     */
    async updateById(id, update, options) {
        return await this.model.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true,
            ...options,
        });
    }
    /**
     * Update multiple documents
     */
    async updateMany(filter, update) {
        const result = await this.model.updateMany(filter, update);
        return {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
        };
    }
    /**
     * Increment a field value
     */
    async increment(filter, field, value = 1) {
        return await this.updateOne(filter, { $inc: { [field]: value } });
    }
    /**
     * Decrement a field value
     */
    async decrement(filter, field, value = 1) {
        return await this.increment(filter, field, -value);
    }
    /**
     * Delete a single document
     */
    async deleteOne(filter) {
        return await this.model.findOneAndDelete(filter);
    }
    /**
     * Delete a document by ID
     */
    async deleteById(id) {
        return await this.model.findByIdAndDelete(id);
    }
    /**
     * Delete multiple documents
     */
    async deleteMany(filter) {
        const result = await this.model.deleteMany(filter);
        return result.deletedCount;
    }
    /**
     * Count documents
     */
    async count(filter = {}) {
        return await this.model.countDocuments(filter);
    }
    /**
     * Check if document exists
     */
    async exists(filter) {
        const count = await this.model.countDocuments(filter).limit(1);
        return count > 0;
    }
    /**
     * Find documents and return distinct values for a field
     */
    async distinct(field, filter = {}) {
        return await this.model.distinct(field, filter);
    }
    /**
     * Aggregate data
     */
    async aggregate(pipeline) {
        return await this.model.aggregate(pipeline);
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=BaseRepository.js.map
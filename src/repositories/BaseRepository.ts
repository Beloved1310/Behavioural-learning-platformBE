import { Model, Document, FilterQuery, UpdateQuery, QueryOptions, SortOrder } from 'mongoose';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: { [key: string]: SortOrder };
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
export abstract class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  /**
   * Create a new document
   */
  async create(data: Partial<T>): Promise<T> {
    return await this.model.create(data);
  }

  /**
   * Create multiple documents
   */
  async createMany(data: Partial<T>[]): Promise<T[]> {
    return await this.model.insertMany(data) as unknown as T[];
  }

  /**
   * Find a single document by filter
   */
  async findOne(filter: FilterQuery<T>, options?: QueryOptions): Promise<T | null> {
    return await this.model.findOne(filter, null, options);
  }

  /**
   * Find a document by ID
   */
  async findById(id: string, options?: QueryOptions): Promise<T | null> {
    return await this.model.findById(id, null, options);
  }

  /**
   * Find multiple documents
   */
  async find(filter: FilterQuery<T> = {}, options?: QueryOptions): Promise<T[]> {
    return await this.model.find(filter, null, options);
  }

  /**
   * Find documents with pagination
   */
  async findPaginated(
    filter: FilterQuery<T> = {},
    paginationOptions: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
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
  async updateOne(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: QueryOptions
  ): Promise<T | null> {
    return await this.model.findOneAndUpdate(filter, update, {
      new: true,
      runValidators: true,
      ...options,
    });
  }

  /**
   * Update a document by ID
   */
  async updateById(
    id: string,
    update: UpdateQuery<T>,
    options?: QueryOptions
  ): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
      ...options,
    });
  }

  /**
   * Update multiple documents
   */
  async updateMany(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    const result = await this.model.updateMany(filter, update);
    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }

  /**
   * Increment a field value
   */
  async increment(
    filter: FilterQuery<T>,
    field: string,
    value: number = 1
  ): Promise<T | null> {
    return await this.updateOne(filter, { $inc: { [field]: value } } as UpdateQuery<T>);
  }

  /**
   * Decrement a field value
   */
  async decrement(
    filter: FilterQuery<T>,
    field: string,
    value: number = 1
  ): Promise<T | null> {
    return await this.increment(filter, field, -value);
  }

  /**
   * Delete a single document
   */
  async deleteOne(filter: FilterQuery<T>): Promise<T | null> {
    return await this.model.findOneAndDelete(filter);
  }

  /**
   * Delete a document by ID
   */
  async deleteById(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id);
  }

  /**
   * Delete multiple documents
   */
  async deleteMany(filter: FilterQuery<T>): Promise<number> {
    const result = await this.model.deleteMany(filter);
    return result.deletedCount;
  }

  /**
   * Count documents
   */
  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return await this.model.countDocuments(filter);
  }

  /**
   * Check if document exists
   */
  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const count = await this.model.countDocuments(filter).limit(1);
    return count > 0;
  }

  /**
   * Find documents and return distinct values for a field
   */
  async distinct(field: string, filter: FilterQuery<T> = {}): Promise<any[]> {
    return await this.model.distinct(field, filter);
  }

  /**
   * Aggregate data
   */
  async aggregate(pipeline: any[]): Promise<any[]> {
    return await this.model.aggregate(pipeline);
  }
}

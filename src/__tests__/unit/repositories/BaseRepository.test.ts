/**
 * Unit Tests for BaseRepository
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Model, Document, SortOrder } from 'mongoose';
import { BaseRepository } from '../../../repositories/BaseRepository';
import { Types } from 'mongoose';

// Mock model
interface MockDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  createdAt: Date;
}

describe('BaseRepository', () => {
  let mockModel: jest.Mocked<Model<any>>;
  let repository: BaseRepository<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock model
    mockModel = {
      create: jest.fn(),
      insertMany: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      updateMany: jest.fn(),
      findOneAndDelete: jest.fn(),
      findByIdAndDelete: jest.fn(),
      deleteMany: jest.fn(),
      countDocuments: jest.fn(),
      distinct: jest.fn(),
      aggregate: jest.fn(),
    } as any;

    // Create repository instance
    class TestRepository extends BaseRepository<any> {
      constructor() {
        super(mockModel as any);
      }
    }

    repository = new TestRepository();
  });

  describe('create', () => {
    it('should create a new document', async () => {
      // Arrange
      const data = { name: 'Test' };
      const mockDoc = { _id: new Types.ObjectId(), ...data };
      (mockModel.create as jest.Mock as any).mockResolvedValue(mockDoc);

      // Act
      const result = await repository.create(data);

      // Assert
      expect(mockModel.create).toHaveBeenCalledWith(data);
      expect(result).toBe(mockDoc);
    });
  });

  describe('createMany', () => {
    it('should create multiple documents', async () => {
      // Arrange
      const data = [{ name: 'Test1' }, { name: 'Test2' }];
      const mockDocs = data.map((d, i) => ({ _id: new Types.ObjectId(), ...d }));
      (mockModel.insertMany as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockDocs);

      // Act
      const result = await repository.createMany(data);

      // Assert
      expect(mockModel.insertMany).toHaveBeenCalledWith(data);
      expect(result).toEqual(mockDocs);
    });
  });

  describe('findOne', () => {
    it('should find a document by filter', async () => {
      // Arrange
      const filter = { name: 'Test' };
      const mockDoc = { _id: new Types.ObjectId(), name: 'Test' };
      (mockModel.findOne as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockDoc);

      // Act
      const result = await repository.findOne(filter);

      // Assert
      expect(mockModel.findOne).toHaveBeenCalledWith(filter, null, undefined);
      expect(result).toBe(mockDoc);
    });

    it('should return null when document not found', async () => {
      // Arrange
      const filter = { name: 'NotFound' };
      (mockModel.findOne as jest.Mock) = (jest.fn() as any).mockResolvedValue(null);

      // Act
      const result = await repository.findOne(filter);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find a document by ID', async () => {
      // Arrange
      const id = new Types.ObjectId().toString();
      const mockDoc = { _id: new Types.ObjectId(id), name: 'Test' } as MockDocument;
      (mockModel.findById as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockDoc);

      // Act
      const result = await repository.findById(id);

      // Assert
      expect(mockModel.findById).toHaveBeenCalledWith(id, null, undefined);
      expect(result).toBe(mockDoc);
    });
  });

  describe('find', () => {
    it('should find multiple documents', async () => {
      // Arrange
      const filter = { name: 'Test' };
      const mockDocs = [
        { _id: new Types.ObjectId(), name: 'Test1' },
        { _id: new Types.ObjectId(), name: 'Test2' },
      ];
      (mockModel.find as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockDocs);

      // Act
      const result = await repository.find(filter);

      // Assert
      expect(mockModel.find).toHaveBeenCalledWith(filter, null, undefined);
      expect(result).toEqual(mockDocs);
    });

    it('should find all documents when no filter provided', async () => {
      // Arrange
      const mockDocs = [] as MockDocument[];
      (mockModel.find as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockDocs);

      // Act
      const result = await repository.find();

      // Assert
      expect(mockModel.find).toHaveBeenCalledWith({}, null, undefined);
      expect(result).toEqual(mockDocs);
    });
  });

  describe('findPaginated', () => {
    it('should find documents with pagination', async () => {
      // Arrange
      const filter = { name: 'Test' };
      const paginationOptions = { page: 2, limit: 10, sort: { createdAt: -1 as SortOrder } };
      const mockDocs = [{ _id: new Types.ObjectId(), name: 'Test' }] as MockDocument[];
      const total = 25;

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: (jest.fn() as any).mockResolvedValue(mockDocs),
      };

      (mockModel.find as jest.Mock) = (jest.fn() as any).mockReturnValue(mockQuery);
      (mockModel.countDocuments as jest.Mock) = (jest.fn() as any).mockResolvedValue(total);

      // Act
      const result = await repository.findPaginated(filter, paginationOptions);

      // Assert
      expect(result.data).toEqual(mockDocs);
      expect(result.total).toBe(total);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
    });

    it('should use default pagination options', async () => {
      // Arrange
      const mockDocs = [] as MockDocument[];
      const total = 0;

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: (jest.fn() as any).mockResolvedValue(mockDocs),
      };

      (mockModel.find as jest.Mock) = (jest.fn() as any).mockReturnValue(mockQuery);
      (mockModel.countDocuments as jest.Mock) = (jest.fn() as any).mockResolvedValue(total);

      // Act
      const result = await repository.findPaginated();

      // Assert
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('updateOne', () => {
    it('should update a document', async () => {
      // Arrange
      const filter = { name: 'Test' };
      const update = { name: 'Updated' };
      const mockDoc = { _id: new Types.ObjectId(), name: 'Updated' } as MockDocument;
      (mockModel.findOneAndUpdate as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockDoc);

      // Act
      const result = await repository.updateOne(filter, update);

      // Assert
      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        filter,
        update,
        expect.objectContaining({ new: true, runValidators: true })
      );
      expect(result).toBe(mockDoc);
    });
  });

  describe('updateById', () => {
    it('should update a document by ID', async () => {
      // Arrange
      const id = new Types.ObjectId().toString();
      const update = { name: 'Updated' };
      const mockDoc = { _id: new Types.ObjectId(id), name: 'Updated' } as MockDocument;
      (mockModel.findByIdAndUpdate as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockDoc);

      // Act
      const result = await repository.updateById(id, update);

      // Assert
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        update,
        expect.objectContaining({ new: true, runValidators: true })
      );
      expect(result).toBe(mockDoc);
    });
  });

  describe('updateMany', () => {
    it('should update multiple documents', async () => {
      // Arrange
      const filter = { name: 'Test' };
      const update = { status: 'active' };
      const result = { matchedCount: 5, modifiedCount: 5 };
      (mockModel.updateMany as jest.Mock as any).mockResolvedValue(result);

      // Act
      const updateResult = await repository.updateMany(filter, update);

      // Assert
      expect(mockModel.updateMany).toHaveBeenCalledWith(filter, update);
      expect(updateResult).toEqual(result);
    });
  });

  describe('increment', () => {
    it('should increment a field value', async () => {
      // Arrange
      const filter = { name: 'Test' };
      const field = 'count';
      const value = 5;
      const mockDoc = { _id: new Types.ObjectId(), count: 10 } as unknown as MockDocument;
      (mockModel.findOneAndUpdate as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockDoc);

      // Act
      const result = await repository.increment(filter, field, value);

      // Assert
      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        filter,
        { $inc: { [field]: value } },
        expect.any(Object)
      );
      expect(result).toBe(mockDoc);
    });

    it('should use default increment value of 1', async () => {
      // Arrange
      const filter = { name: 'Test' };
      const field = 'count';
      const mockDoc = { _id: new Types.ObjectId(), count: 1 } as unknown as MockDocument;
      (mockModel.findOneAndUpdate as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockDoc);

      // Act
      await repository.increment(filter, field);

      // Assert
      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        filter,
        { $inc: { [field]: 1 } },
        expect.any(Object)
      );
    });
  });

  describe('decrement', () => {
    it('should decrement a field value', async () => {
      // Arrange
      const filter = { name: 'Test' };
      const field = 'count';
      const value = 3;
      const mockDoc = { _id: new Types.ObjectId(), count: 7 } as unknown as MockDocument;
      (mockModel.findOneAndUpdate as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockDoc);

      // Act
      const result = await repository.decrement(filter, field, value);

      // Assert
      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        filter,
        { $inc: { [field]: -value } },
        expect.any(Object)
      );
      expect(result).toBe(mockDoc);
    });
  });

  describe('deleteOne', () => {
    it('should delete a document', async () => {
      // Arrange
      const filter = { name: 'Test' };
      const mockDoc = { _id: new Types.ObjectId(), name: 'Test' };
      (mockModel.findOneAndDelete as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockDoc);

      // Act
      const result = await repository.deleteOne(filter);

      // Assert
      expect(mockModel.findOneAndDelete).toHaveBeenCalledWith(filter);
      expect(result).toBe(mockDoc);
    });
  });

  describe('deleteById', () => {
    it('should delete a document by ID', async () => {
      // Arrange
      const id = new Types.ObjectId().toString();
      const mockDoc = { _id: new Types.ObjectId(id), name: 'Test' } as MockDocument;
      (mockModel.findByIdAndDelete as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockDoc);

      // Act
      const result = await repository.deleteById(id);

      // Assert
      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith(id);
      expect(result).toBe(mockDoc);
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple documents', async () => {
      // Arrange
      const filter = { name: 'Test' };
      const deletedCount = 5;
      (mockModel.deleteMany as jest.Mock as any).mockResolvedValue({ deletedCount });

      // Act
      const result = await repository.deleteMany(filter);

      // Assert
      expect(mockModel.deleteMany).toHaveBeenCalledWith(filter);
      expect(result).toBe(deletedCount);
    });
  });

  describe('count', () => {
    it('should count documents', async () => {
      // Arrange
      const filter = { name: 'Test' };
      const count = 10;
      (mockModel.countDocuments as jest.Mock) = (jest.fn() as any).mockResolvedValue(count);

      // Act
      const result = await repository.count(filter);

      // Assert
      expect(mockModel.countDocuments).toHaveBeenCalledWith(filter);
      expect(result).toBe(count);
    });

    it('should count all documents when no filter provided', async () => {
      // Arrange
      const count = 20;
      (mockModel.countDocuments as jest.Mock) = (jest.fn() as any).mockResolvedValue(count);

      // Act
      const result = await repository.count();

      // Assert
      expect(mockModel.countDocuments).toHaveBeenCalledWith({});
      expect(result).toBe(count);
    });
  });

  describe('exists', () => {
    it('should return true when document exists', async () => {
      // Arrange
      const filter = { name: 'Test' };
      const mockQuery = {
        limit: (jest.fn() as any).mockResolvedValue(1),
      };
      (mockModel.countDocuments as jest.Mock) = (jest.fn() as any).mockReturnValue(mockQuery);

      // Act
      const result = await repository.exists(filter);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when document does not exist', async () => {
      // Arrange
      const filter = { name: 'NotFound' };
      const mockQuery = {
        limit: (jest.fn() as any).mockResolvedValue(0),
      };
      (mockModel.countDocuments as jest.Mock) = (jest.fn() as any).mockReturnValue(mockQuery);

      // Act
      const result = await repository.exists(filter);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('distinct', () => {
    it('should return distinct values for a field', async () => {
      // Arrange
      const field = 'name';
      const filter = { status: 'active' };
      const distinctValues = ['Test1', 'Test2', 'Test3'];
      (mockModel.distinct as jest.Mock as any).mockResolvedValue(distinctValues);

      // Act
      const result = await repository.distinct(field, filter);

      // Assert
      expect(mockModel.distinct).toHaveBeenCalledWith(field, filter);
      expect(result).toEqual(distinctValues);
    });

    it('should use empty filter when not provided', async () => {
      // Arrange
      const field = 'name';
      const distinctValues = ['Test1', 'Test2'];
      (mockModel.distinct as jest.Mock as any).mockResolvedValue(distinctValues);

      // Act
      const result = await repository.distinct(field);

      // Assert
      expect(mockModel.distinct).toHaveBeenCalledWith(field, {});
      expect(result).toEqual(distinctValues);
    });
  });

  describe('aggregate', () => {
    it('should execute aggregation pipeline', async () => {
      // Arrange
      const pipeline = [
        { $match: { status: 'active' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ];
      const result = [{ _id: 'cat1', count: 5 }];
      (mockModel.aggregate as jest.Mock as any).mockResolvedValue(result);

      // Act
      const aggregateResult = await repository.aggregate(pipeline);

      // Assert
      expect(mockModel.aggregate).toHaveBeenCalledWith(pipeline);
      expect(aggregateResult).toEqual(result);
    });
  });
});

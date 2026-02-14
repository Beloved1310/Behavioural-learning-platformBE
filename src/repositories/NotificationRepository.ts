import { FilterQuery, Types } from 'mongoose';
import { Notification } from '../models/Notification';
import { INotification } from '../types';
import { BaseRepository } from './BaseRepository';

class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(Notification as any);
  }

  /**
   * Find notifications by user ID with filters
   */
  async findByUserId(
    userId: string,
    options: {
      unreadOnly?: boolean;
      type?: string;
      page?: number;
      limit?: number;
      skip?: number;
    } = {}
  ) {
    const query: FilterQuery<INotification> = {
      userId: new Types.ObjectId(userId),
    };

    if (options.unreadOnly) {
      query.isRead = false;
    }

    if (options.type) {
      query.type = options.type;
    }

    return await this.find(query, {
      sort: { createdAt: -1 },
      skip: options.skip,
      limit: options.limit,
    });
  }

  /**
   * Count notifications by user ID with filters
   */
  async countByUserId(
    userId: string,
    filters: { unreadOnly?: boolean; type?: string } = {}
  ): Promise<number> {
    const query: FilterQuery<INotification> = {
      userId: new Types.ObjectId(userId),
    };

    if (filters.unreadOnly) {
      query.isRead = false;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    return await this.count(query);
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await this.count({
      userId: new Types.ObjectId(userId),
      isRead: false,
    } as FilterQuery<INotification>);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<INotification | null> {
    return await this.updateOne(
      { _id: new Types.ObjectId(notificationId) } as FilterQuery<INotification>,
      { isRead: true } as any
    );
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string) {
    return await this.model.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true }
    );
  }

  /**
   * Delete notification by ID
   */
  async deleteById(notificationId: string): Promise<INotification | null> {
    return await this.deleteOne({
      _id: new Types.ObjectId(notificationId),
    } as FilterQuery<INotification>);
  }
}

export const notificationRepository = new NotificationRepository();
export default notificationRepository;

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import tutorAvailabilityRepository from '../repositories/TutorAvailabilityRepository';
import { Types } from 'mongoose';
import { UserRole } from '../types';

export class TutorAvailabilityController {
  // Get tutor's availability
  static getAvailability = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;

    if (req.user!.role !== UserRole.TUTOR) {
      throw new AppError('Only tutors can access availability', 403);
    }

    const availabilities = await tutorAvailabilityRepository.findByTutor(tutorId, true);

    res.json({
      success: true,
      availabilities: (availabilities as any[]).map((avail) => ({
        id: avail._id.toString(),
        dayOfWeek: avail.dayOfWeek,
        startTime: avail.startTime,
        endTime: avail.endTime,
        isRecurring: avail.isRecurring,
        specificDate: avail.specificDate ? avail.specificDate.toISOString() : undefined,
        isActive: avail.isActive,
      })),
    });
  });

  // Set tutor's availability (replaces all existing)
  static setAvailability = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;

    if (req.user!.role !== UserRole.TUTOR) {
      throw new AppError('Only tutors can set availability', 403);
    }

    // Handle both direct array and wrapped object
    let availabilities = req.body.availabilities;

    // If body is directly an array, use it
    if (Array.isArray(req.body) && !availabilities) {
      availabilities = req.body;
    }

    // If availabilities is not defined, check if body has the data directly
    if (!availabilities && req.body && typeof req.body === 'object') {
      // Check if the keys suggest it's the availability data itself
      if (req.body.dayOfWeek !== undefined) {
        // Single availability object, wrap in array
        availabilities = [req.body];
      }
    }

    if (!Array.isArray(availabilities)) {
      throw new AppError('availabilities must be an array', 400);
    }

    // Validate each availability entry
    for (const avail of availabilities) {
      if (typeof avail.dayOfWeek !== 'number' || avail.dayOfWeek < 0 || avail.dayOfWeek > 6) {
        throw new AppError('dayOfWeek must be a number between 0-6', 400);
      }
      if (!avail.startTime || !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(avail.startTime)) {
        throw new AppError('startTime must be in HH:mm format', 400);
      }
      if (!avail.endTime || !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(avail.endTime)) {
        throw new AppError('endTime must be in HH:mm format', 400);
      }
      if (avail.startTime >= avail.endTime) {
        throw new AppError('startTime must be before endTime', 400);
      }
    }

    // Delete existing availabilities
    await tutorAvailabilityRepository.deleteByTutor(tutorId);

    // Create new availabilities
    const created = await Promise.all(
      availabilities.map(async (avail) => {
        const availabilityData = {
          tutorId: new Types.ObjectId(tutorId) as any,
          dayOfWeek: avail.dayOfWeek,
          startTime: avail.startTime,
          endTime: avail.endTime,
          isRecurring: avail.isRecurring !== false, // Default to true
          specificDate: avail.specificDate ? new Date(avail.specificDate) : undefined,
          isActive: true,
        };

        return await tutorAvailabilityRepository.create(availabilityData as any);
      })
    );

    res.json({
      success: true,
      message: 'Availability updated successfully',
      availabilities: (created as any[]).map((avail) => ({
        id: avail._id.toString(),
        dayOfWeek: avail.dayOfWeek,
        startTime: avail.startTime,
        endTime: avail.endTime,
        isRecurring: avail.isRecurring,
        specificDate: avail.specificDate ? avail.specificDate.toISOString() : undefined,
        isActive: avail.isActive,
      })),
    });
  });

  // Add a single availability slot
  static addAvailability = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;

    if (req.user!.role !== UserRole.TUTOR) {
      throw new AppError('Only tutors can add availability', 403);
    }

    const { dayOfWeek, startTime, endTime, isRecurring, specificDate } = req.body;

    if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6) {
      throw new AppError('dayOfWeek must be a number between 0-6', 400);
    }
    if (!startTime || !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
      throw new AppError('startTime must be in HH:mm format', 400);
    }
    if (!endTime || !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(endTime)) {
      throw new AppError('endTime must be in HH:mm format', 400);
    }
    if (startTime >= endTime) {
      throw new AppError('startTime must be before endTime', 400);
    }

    const availability = await tutorAvailabilityRepository.create({
      tutorId: new Types.ObjectId(tutorId) as any,
      dayOfWeek,
      startTime,
      endTime,
      isRecurring: isRecurring !== false,
      specificDate: specificDate ? new Date(specificDate) : undefined,
      isActive: true,
    } as any);

    res.status(201).json({
      success: true,
      availability: {
        id: (availability as any)._id.toString(),
        dayOfWeek: (availability as any).dayOfWeek,
        startTime: (availability as any).startTime,
        endTime: (availability as any).endTime,
        isRecurring: (availability as any).isRecurring,
        specificDate: (availability as any).specificDate,
        isActive: (availability as any).isActive,
      },
    });
  });

  // Delete availability slot
  static deleteAvailability = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;
    const { id } = req.params;

    if (req.user!.role !== UserRole.TUTOR) {
      throw new AppError('Only tutors can delete availability', 403);
    }

    const availability = await tutorAvailabilityRepository.findById(id);
    if (!availability) {
      throw new AppError('Availability not found', 404);
    }

    if ((availability as any).tutorId.toString() !== tutorId) {
      throw new AppError('You can only delete your own availability', 403);
    }

    await tutorAvailabilityRepository.deleteOne({ _id: new Types.ObjectId(id) } as any);

    res.json({
      success: true,
      message: 'Availability deleted successfully',
    });
  });
}

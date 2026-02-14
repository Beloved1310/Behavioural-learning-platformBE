"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorAvailabilityController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const TutorAvailabilityRepository_1 = __importDefault(require("../repositories/TutorAvailabilityRepository"));
const mongoose_1 = require("mongoose");
const types_1 = require("../types");
class TutorAvailabilityController {
}
exports.TutorAvailabilityController = TutorAvailabilityController;
_a = TutorAvailabilityController;
// Get tutor's availability
TutorAvailabilityController.getAvailability = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can access availability', 403);
    }
    const availabilities = await TutorAvailabilityRepository_1.default.findByTutor(tutorId, true);
    res.json({
        success: true,
        availabilities: availabilities.map((avail) => ({
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
TutorAvailabilityController.setAvailability = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can set availability', 403);
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
        throw new errorHandler_1.AppError('availabilities must be an array', 400);
    }
    // Validate each availability entry
    for (const avail of availabilities) {
        if (typeof avail.dayOfWeek !== 'number' || avail.dayOfWeek < 0 || avail.dayOfWeek > 6) {
            throw new errorHandler_1.AppError('dayOfWeek must be a number between 0-6', 400);
        }
        if (!avail.startTime || !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(avail.startTime)) {
            throw new errorHandler_1.AppError('startTime must be in HH:mm format', 400);
        }
        if (!avail.endTime || !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(avail.endTime)) {
            throw new errorHandler_1.AppError('endTime must be in HH:mm format', 400);
        }
        if (avail.startTime >= avail.endTime) {
            throw new errorHandler_1.AppError('startTime must be before endTime', 400);
        }
    }
    // Delete existing availabilities
    await TutorAvailabilityRepository_1.default.deleteByTutor(tutorId);
    // Create new availabilities
    const created = await Promise.all(availabilities.map(async (avail) => {
        const availabilityData = {
            tutorId: new mongoose_1.Types.ObjectId(tutorId),
            dayOfWeek: avail.dayOfWeek,
            startTime: avail.startTime,
            endTime: avail.endTime,
            isRecurring: avail.isRecurring !== false, // Default to true
            specificDate: avail.specificDate ? new Date(avail.specificDate) : undefined,
            isActive: true,
        };
        return await TutorAvailabilityRepository_1.default.create(availabilityData);
    }));
    res.json({
        success: true,
        message: 'Availability updated successfully',
        availabilities: created.map((avail) => ({
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
TutorAvailabilityController.addAvailability = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can add availability', 403);
    }
    const { dayOfWeek, startTime, endTime, isRecurring, specificDate } = req.body;
    if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6) {
        throw new errorHandler_1.AppError('dayOfWeek must be a number between 0-6', 400);
    }
    if (!startTime || !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
        throw new errorHandler_1.AppError('startTime must be in HH:mm format', 400);
    }
    if (!endTime || !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(endTime)) {
        throw new errorHandler_1.AppError('endTime must be in HH:mm format', 400);
    }
    if (startTime >= endTime) {
        throw new errorHandler_1.AppError('startTime must be before endTime', 400);
    }
    const availability = await TutorAvailabilityRepository_1.default.create({
        tutorId: new mongoose_1.Types.ObjectId(tutorId),
        dayOfWeek,
        startTime,
        endTime,
        isRecurring: isRecurring !== false,
        specificDate: specificDate ? new Date(specificDate) : undefined,
        isActive: true,
    });
    res.status(201).json({
        success: true,
        availability: {
            id: availability._id.toString(),
            dayOfWeek: availability.dayOfWeek,
            startTime: availability.startTime,
            endTime: availability.endTime,
            isRecurring: availability.isRecurring,
            specificDate: availability.specificDate,
            isActive: availability.isActive,
        },
    });
});
// Delete availability slot
TutorAvailabilityController.deleteAvailability = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tutorId = req.user.id;
    const { id } = req.params;
    if (req.user.role !== types_1.UserRole.TUTOR) {
        throw new errorHandler_1.AppError('Only tutors can delete availability', 403);
    }
    const availability = await TutorAvailabilityRepository_1.default.findById(id);
    if (!availability) {
        throw new errorHandler_1.AppError('Availability not found', 404);
    }
    if (availability.tutorId.toString() !== tutorId) {
        throw new errorHandler_1.AppError('You can only delete your own availability', 403);
    }
    await TutorAvailabilityRepository_1.default.deleteOne({ _id: new mongoose_1.Types.ObjectId(id) });
    res.json({
        success: true,
        message: 'Availability deleted successfully',
    });
});
//# sourceMappingURL=tutorAvailabilityController.js.map
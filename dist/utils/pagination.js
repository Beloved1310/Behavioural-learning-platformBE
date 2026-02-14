"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginationParams = getPaginationParams;
exports.createPaginationResult = createPaginationResult;
/**
 * Extract pagination parameters from request query
 * @param req Express request object
 * @param defaultLimit Default items per page (default: 10)
 * @param maxLimit Maximum items per page (default: 100)
 * @returns Pagination parameters
 */
function getPaginationParams(req, defaultLimit = 10, maxLimit = 100) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    let limit = parseInt(req.query.limit) || defaultLimit;
    // Enforce maximum limit
    limit = Math.min(limit, maxLimit);
    limit = Math.max(1, limit); // Ensure limit is at least 1
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
/**
 * Create pagination response object
 * @param data Array of data items
 * @param total Total number of items (before pagination)
 * @param page Current page number
 * @param limit Items per page
 * @returns Paginated response object
 */
function createPaginationResult(data, total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
}
//# sourceMappingURL=pagination.js.map
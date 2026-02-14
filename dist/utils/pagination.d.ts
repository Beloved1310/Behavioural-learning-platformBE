import { Request } from 'express';
export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}
export interface PaginationResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}
/**
 * Extract pagination parameters from request query
 * @param req Express request object
 * @param defaultLimit Default items per page (default: 10)
 * @param maxLimit Maximum items per page (default: 100)
 * @returns Pagination parameters
 */
export declare function getPaginationParams(req: Request, defaultLimit?: number, maxLimit?: number): PaginationParams;
/**
 * Create pagination response object
 * @param data Array of data items
 * @param total Total number of items (before pagination)
 * @param page Current page number
 * @param limit Items per page
 * @returns Paginated response object
 */
export declare function createPaginationResult<T>(data: T[], total: number, page: number, limit: number): PaginationResult<T>;
/**
 * Standard pagination response format
 */
export interface StandardPaginationResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}
//# sourceMappingURL=pagination.d.ts.map
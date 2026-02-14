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
export function getPaginationParams(
  req: Request,
  defaultLimit: number = 10,
  maxLimit: number = 100
): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  let limit = parseInt(req.query.limit as string) || defaultLimit;

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
export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> {
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

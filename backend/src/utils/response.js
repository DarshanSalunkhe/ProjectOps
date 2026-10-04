/**
 * Standard success response format
 */
export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  });
};

/**
 * Standard error response format
 */
export const errorResponse = (res, message = 'Error', statusCode = 500, error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error
  });
};

/**
 * Paginated response format
 */
export const paginatedResponse = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit)
    },
    message
  });
};

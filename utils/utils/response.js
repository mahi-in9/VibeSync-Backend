/**
 * Success Response
 * @param {Object} res - Express response object
 * @param {Object} data - Data to send
 * @param {string} message - Optional message
 * @param {number} statusCode - HTTP status code (default 200)
 */
export const successResponse = (
  res,
  data = {},
  message = "Success",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Error Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default 500)
 * @param {Object} error - Optional error details
 */
export const errorResponse = (
  res,
  message = "Internal Server Error",
  statusCode = 500,
  error = null
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};

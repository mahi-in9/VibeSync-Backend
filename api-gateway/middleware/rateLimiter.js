import rateLimit from "express-rate-limit";

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // max requests per window per IP
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

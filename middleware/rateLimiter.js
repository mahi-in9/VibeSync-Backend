import rateLimit from "express-rate-limit";

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 60,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

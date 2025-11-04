import rateLimit from "express-rate-limit";

export const createRateLimiter = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

export const globalRateLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "1000")
);

export const authRateLimiter = createRateLimiter(15 * 60 * 1000, 5);

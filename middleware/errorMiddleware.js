/**
 * middleware/errorMiddleware.js
 * ─────────────────────────────────────────────────────────
 * Centralized error handling — replaces individual
 * try/catch res.status(500) blocks in every controller.
 *
 * Usage in controllers: next(error) instead of res.status(500)
 * Usage in server.js: app.use(notFound); app.use(errorHandler);
 * ─────────────────────────────────────────────────────────
 */

// @desc    Handle 404 — route not matched
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found — ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// @desc    Global error handler
//          Catches errors forwarded via next(error) from any controller
export const errorHandler = (err, req, res, next) => {
  // If headers already sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  // Use res.statusCode if already set (e.g., 401, 400), else default to 500
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    // Only expose stack trace in development
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

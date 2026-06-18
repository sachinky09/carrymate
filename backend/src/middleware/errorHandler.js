import { logError } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  const fileName = err.fileName || 'unknown';
  const statusCode = err.statusCode || 500;

  console.error(`[ERROR] file=${fileName} path=${req.method} ${req.originalUrl} message=${err.message}`);
  if (err.stack) console.error(err.stack);

  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    file: fileName
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

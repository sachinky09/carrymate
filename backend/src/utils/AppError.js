export class AppError extends Error {
  constructor(message, statusCode, fileName) {
    super(message);
    this.statusCode = statusCode || 500;
    this.fileName = fileName || 'unknown';
    this.isAppError = true;
  }
}

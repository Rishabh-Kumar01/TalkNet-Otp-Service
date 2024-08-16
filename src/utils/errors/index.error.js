class AppError extends Error {
  constructor(name, statusCode, description, isOperational = true) {
    super(description);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this);
  }
}

class ValidationError extends AppError {
  constructor(description = "Validation Error") {
    super("VALIDATION_ERROR", 400, description);
  }
}

class ServiceError extends AppError {
  constructor(description = "Service Error") {
    super("SERVICE_ERROR", 500, description);
  }
}

module.exports = {
  AppError,
  ValidationError,
  ServiceError,
};

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom exception for business logic errors
 */
export class BusinessException extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        error: 'Business Logic Error',
        message,
        details,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Exception for resource not found
 */
export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;

    super(
      {
        error: 'Resource Not Found',
        message,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * Exception for unauthorized access
 */
export class UnauthorizedAccessException extends HttpException {
  constructor(
    message: string = 'You do not have permission to perform this action',
  ) {
    super(
      {
        error: 'Unauthorized Access',
        message,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

/**
 * Exception for invalid credentials
 */
export class InvalidCredentialsException extends HttpException {
  constructor(message: string = 'Invalid email or password') {
    super(
      {
        error: 'Invalid Credentials',
        message,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

/**
 * Exception for expired tokens or OTPs
 */
export class ExpiredException extends HttpException {
  constructor(resource: string = 'Token') {
    super(
      {
        error: 'Expired',
        message: `${resource} has expired`,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

/**
 * Exception for validation errors
 */
export class ValidationException extends HttpException {
  constructor(message: string | string[], details?: any) {
    super(
      {
        error: 'Validation Failed',
        message,
        details,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Exception for duplicate resources
 */
export class DuplicateResourceException extends HttpException {
  constructor(resource: string, field?: string) {
    const message = field
      ? `${resource} with this ${field} already exists`
      : `${resource} already exists`;

    super(
      {
        error: 'Duplicate Resource',
        message,
      },
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * Exception for rate limiting
 */
export class RateLimitException extends HttpException {
  constructor(retryAfter?: number) {
    super(
      {
        error: 'Rate Limit Exceeded',
        message: 'Too many requests. Please try again later.',
        ...(retryAfter && { retryAfter }),
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

/**
 * Exception for external service errors
 */
export class ExternalServiceException extends HttpException {
  constructor(service: string, message?: string) {
    super(
      {
        error: 'External Service Error',
        message: message || `Failed to communicate with ${service}`,
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}

/**
 * Exception for invalid operations
 */
export class InvalidOperationException extends HttpException {
  constructor(message: string) {
    super(
      {
        error: 'Invalid Operation',
        message,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
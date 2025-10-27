import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';
    let details: any = null;

    // Handle HTTP Exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        error = responseObj.error || exception.name;
        details = responseObj.details || null;
      }
    }
    // Handle TypeORM Database Errors
    else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      const dbError = exception as any;

      // PostgreSQL error codes
      switch (dbError.code) {
        case '23505': // unique violation
          error = 'Duplicate Entry';
          message = this.extractDuplicateFieldMessage(dbError);
          break;
        case '23503': // foreign key violation
          error = 'Foreign Key Violation';
          message = 'Referenced record does not exist or cannot be deleted';
          break;
        case '23502': // not null violation
          error = 'Missing Required Field';
          message = this.extractNotNullMessage(dbError);
          break;
        case '22P02': // invalid text representation
          error = 'Invalid Data Format';
          message = 'Invalid data format provided';
          break;
        default:
          error = 'Database Error';
          message = 'A database error occurred';
          details =
            process.env.NODE_ENV === 'development' ? dbError.message : null;
      }
    }
    // Handle Validation Errors
    else if (exception instanceof Error) {
      if (exception.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        error = 'Validation Error';
        message = exception.message;
      } else {
        error = exception.name;
        message = exception.message;
        details =
          process.env.NODE_ENV === 'development' ? exception.stack : null;
      }
    }

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Error: ${error}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    );

    // Build error response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error,
      message,
      ...(details && { details }),
    };

    response.status(status).json(errorResponse);
  }

  private extractDuplicateFieldMessage(error: any): string {
    const detail = error.detail || '';

    // Extract field name from error detail
    const keyMatch = detail.match(/Key \((.*?)\)=/);
    if (keyMatch && keyMatch[1]) {
      const field = keyMatch[1];
      return `${this.formatFieldName(field)} already exists`;
    }

    return 'Duplicate entry detected';
  }

  private extractNotNullMessage(error: any): string {
    const column = error.column;
    if (column) {
      return `${this.formatFieldName(column)} is required`;
    }
    return 'Required field is missing';
  }

  private formatFieldName(field: string): string {
    // Convert snake_case to Title Case
    return field
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

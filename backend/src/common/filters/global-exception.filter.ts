import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ResponseUtil } from '../utils/response.util';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: any = null;

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        details = (exceptionResponse as any).details || null;
      }

      code = this.getErrorCode(status);
    } else if (exception?.name === 'ValidationError') {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      code = 'VALIDATION_ERROR';
      details = exception.errors;
    } else if (exception?.name === 'MongoError' || exception?.name === 'MongoServerError') {
      status = HttpStatus.BAD_REQUEST;

      if (exception.code === 11000) {
        message = 'Duplicate key error';
        code = 'DUPLICATE_KEY';
        details = this.extractDuplicateKeyInfo(exception);
      } else {
        message = 'Database error';
        code = 'DATABASE_ERROR';
      }
    } else if (exception?.name === 'CastError') {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid ID format';
      code = 'INVALID_ID';
    } else {
      // Log unexpected errors
      this.logger.error(
        `Unexpected error: ${exception?.message || 'Unknown error'}`,
        exception?.stack,
        {
          url: request.url,
          method: request.method,
          body: request.body,
          params: request.params,
          query: request.query,
        },
      );
    }

    // Mask sensitive information in production
    if (process.env.NODE_ENV === 'production') {
      details = this.maskSensitiveData(details);
    }

    const errorResponse = ResponseUtil.error(message, code, details);

    response.status(status).send(errorResponse);
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMIT_EXCEEDED';
      default:
        return 'INTERNAL_ERROR';
    }
  }

  private extractDuplicateKeyInfo(error: any): any {
    const keyValue = error.keyValue || {};
    const field = Object.keys(keyValue)[0];
    const value = keyValue[field];

    return {
      field,
      value,
      message: `${field} '${value}' already exists`,
    };
  }

  private maskSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];

    const masked = { ...data };

    for (const field of sensitiveFields) {
      if (masked[field]) {
        masked[field] = '***MASKED***';
      }
    }

    return masked;
  }
}

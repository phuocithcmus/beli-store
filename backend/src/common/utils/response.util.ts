import { BaseResponseDto, SuccessResponseDto, ErrorResponseDto } from '../dto/base-response.dto';
import { PaginationResponse, PaginationMeta } from '../dto/pagination.dto';

export class ResponseUtil {
  /**
   * Create a successful response
   */
  static success<T>(data: T, message = 'Operation successful'): SuccessResponseDto<T> {
    return new SuccessResponseDto(data, message);
  }

  /**
   * Create an error response
   */
  static error(
    message: string,
    code: string,
    details?: any,
    statusMessage = 'Operation failed',
  ): ErrorResponseDto {
    return new ErrorResponseDto(message, code, details, statusMessage);
  }

  /**
   * Create a paginated response
   */
  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message = 'Data retrieved successfully',
  ): SuccessResponseDto<PaginationResponse<T>> {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
    };

    return new SuccessResponseDto({ data, meta }, message);
  }

  /**
   * Create a response for created resources
   */
  static created<T>(data: T, message = 'Resource created successfully'): SuccessResponseDto<T> {
    return new SuccessResponseDto(data, message);
  }

  /**
   * Create a response for updated resources
   */
  static updated<T>(data: T, message = 'Resource updated successfully'): SuccessResponseDto<T> {
    return new SuccessResponseDto(data, message);
  }

  /**
   * Create a response for deleted resources
   */
  static deleted(message = 'Resource deleted successfully'): SuccessResponseDto<null> {
    return new SuccessResponseDto(null, message);
  }

  /**
   * Create a not found error response
   */
  static notFound(resource = 'Resource'): ErrorResponseDto {
    return new ErrorResponseDto(`${resource} not found`, 'NOT_FOUND');
  }

  /**
   * Create a validation error response
   */
  static validationError(details: any): ErrorResponseDto {
    return new ErrorResponseDto('Validation failed', 'VALIDATION_ERROR', details);
  }

  /**
   * Create an unauthorized error response
   */
  static unauthorized(message = 'Unauthorized access'): ErrorResponseDto {
    return new ErrorResponseDto(message, 'UNAUTHORIZED');
  }

  /**
   * Create a forbidden error response
   */
  static forbidden(message = 'Forbidden access'): ErrorResponseDto {
    return new ErrorResponseDto(message, 'FORBIDDEN');
  }

  /**
   * Create a conflict error response
   */
  static conflict(message = 'Resource already exists'): ErrorResponseDto {
    return new ErrorResponseDto(message, 'CONFLICT');
  }

  /**
   * Create an internal server error response
   */
  static internalError(message = 'Internal server error'): ErrorResponseDto {
    return new ErrorResponseDto(message, 'INTERNAL_ERROR');
  }
}

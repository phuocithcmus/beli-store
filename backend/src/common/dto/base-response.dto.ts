export class BaseResponseDto<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    version: string;
  };

  constructor(success: boolean, message: string, data?: T, error?: BaseResponseDto<T>['error']) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
    this.meta = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}

export class SuccessResponseDto<T = any> extends BaseResponseDto<T> {
  constructor(data: T, message = 'Operation successful') {
    super(true, message, data);
  }
}

export class ErrorResponseDto extends BaseResponseDto {
  constructor(message: string, code: string, details?: any, statusMessage = 'Operation failed') {
    super(false, statusMessage, undefined, {
      code,
      message,
      details,
    });
  }
}

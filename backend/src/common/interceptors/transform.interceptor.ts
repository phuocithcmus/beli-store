import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseUtil } from '../utils/response.util';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        // If the response is already formatted (e.g., from ResponseUtil), return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Transform raw data into standardized response format
        return ResponseUtil.success(data);
      }),
    );
  }
}

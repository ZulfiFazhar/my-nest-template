import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();
    const path = request.url;

    return next.handle().pipe(
      map((data: T) => {
        // If already formatted (from manual formatting), return as-is
        if (this.isApiResponse(data)) {
          return {
            message: data.message,
            data: data.data as T,
            timestamp: new Date().toISOString(),
            path,
          };
        }

        // Auto-format based on HTTP status
        const statusCode = response.statusCode;
        const message = this.getDefaultMessage(statusCode);

        return {
          message,
          data,
          timestamp: new Date().toISOString(),
          path,
        };
      }),
    );
  }

  private isApiResponse(data: unknown): data is ApiResponse<unknown> {
    return (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      'data' in data
    );
  }

  private getDefaultMessage(statusCode: number): string {
    switch (statusCode) {
      case 200:
        return 'Success';
      case 201:
        return 'Created successfully';
      case 204:
        return 'Deleted successfully';
      default:
        return 'Success';
    }
  }
}

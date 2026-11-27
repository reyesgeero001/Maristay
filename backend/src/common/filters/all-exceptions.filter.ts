import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

/**
 * Converts every error into one consistent JSON shape:
 *   { statusCode, error, message, path, timestamp }
 * Database errors are translated into safe messages so SQL details,
 * table names and stack traces never reach the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'An unexpected error occurred';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message =
        typeof body === 'string'
          ? body
          : ((body as { message?: string | string[] }).message ?? exception.message);
    } else if (exception instanceof QueryFailedError) {
      const code = (exception as QueryFailedError & { code?: string }).code;
      switch (code) {
        case 'ER_DUP_ENTRY':
          status = HttpStatus.CONFLICT;
          message = 'A record with the same unique value already exists';
          break;
        case 'ER_NO_REFERENCED_ROW':
        case 'ER_NO_REFERENCED_ROW_2':
          status = HttpStatus.BAD_REQUEST;
          message = 'A referenced record does not exist';
          break;
        case 'ER_ROW_IS_REFERENCED':
        case 'ER_ROW_IS_REFERENCED_2':
          status = HttpStatus.CONFLICT;
          message = 'The record is referenced by other records and cannot be removed';
          break;
        case 'ER_CHECK_CONSTRAINT_VIOLATED':
        case 'ER_CONSTRAINT_FAILED':
          status = HttpStatus.BAD_REQUEST;
          message = 'The data violates a database constraint';
          break;
        default:
          this.logger.error(`Database error (${code ?? 'unknown'}) on ${request.method} ${request.path}`);
      }
    } else {
      // Log only the error message/stack; request bodies may contain secrets.
      const err = exception as Error;
      this.logger.error(`Unhandled error on ${request.method} ${request.path}: ${err?.message}`, err?.stack);
    }

    response.status(status).json({
      statusCode: status,
      error: HttpStatus[status] ?? 'Error',
      message,
      path: request.originalUrl ?? request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

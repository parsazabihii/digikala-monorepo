import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

import { AppException } from './app.exception.js';

export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: unknown;
  path: string;
  timestamp: string;
  requestId: string;
}

type ErrorDescription = Pick<ErrorResponse, 'statusCode' | 'error' | 'message' | 'details'>;

// Every error leaves the API in the ErrorResponse shape. Unknown errors become a generic 500:
// their message and stack can hold internals, so they are logged and never sent to the client.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const reply = http.getResponse<FastifyReply>();

    const body: ErrorResponse = {
      ...this.describe(exception),
      path: request.url,
      timestamp: new Date().toISOString(),
      requestId: request.id,
    };
    void reply.status(body.statusCode).send(body);
  }

  private describe(exception: unknown): ErrorDescription {
    if (exception instanceof AppException) {
      return {
        statusCode: exception.status,
        error: exception.code,
        message: exception.message,
        ...(exception.details === undefined ? {} : { details: exception.details }),
      };
    }

    if (exception instanceof HttpException) {
      return {
        statusCode: exception.getStatus(),
        error: toErrorCode(exception),
        message: exception.message,
      };
    }

    this.logger.error(exception);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error',
    };
  }
}

// NotFoundException → NOT_FOUND, PayloadTooLargeException → PAYLOAD_TOO_LARGE.
// A bare HttpException has no telling name (Nest wraps Fastify's body-parsing errors in one),
// so it takes the name of its status instead: 415 → UNSUPPORTED_MEDIA_TYPE.
function toErrorCode(exception: HttpException): string {
  if (exception.constructor === HttpException) {
    return HttpStatus[exception.getStatus()] ?? 'HTTP_ERROR';
  }
  return exception.name
    .replace(/Exception$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

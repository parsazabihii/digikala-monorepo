import { HttpStatus, PipeTransform } from '@nestjs/common';
import { z } from 'zod';

import { AppException } from './app.exception.js';

export interface ValidationIssue {
  path: string;
  message: string;
}

// Usage: `@Body(new ZodValidationPipe(schema)) body: z.output<typeof schema>`.
// Returns the parsed value, so defaults, coercions and transforms in the schema apply.
// A failure is thrown as an AppException rather than the raw ZodError: a ZodError from
// anywhere else (e.g. parsing our own data) is a server bug and stays a 500.
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform<unknown, z.output<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.output<T> {
    const result = this.schema.safeParse(value);
    if (result.success) {
      return result.data;
    }

    const details: ValidationIssue[] = result.error.issues.map((issue) => ({
      path: issue.path.map(String).join('.'),
      message: issue.message,
    }));
    throw new AppException(
      'VALIDATION_FAILED',
      HttpStatus.BAD_REQUEST,
      'Request validation failed',
      details,
    );
  }
}

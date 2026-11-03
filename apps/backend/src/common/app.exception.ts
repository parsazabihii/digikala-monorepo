import { HttpStatus } from '@nestjs/common';

// Base class for errors the API reports on purpose. `code` is the machine-readable `error`
// field of the response, so clients can branch on it; changing one is a breaking change.
export class AppException extends Error {
  constructor(
    readonly code: string,
    readonly status: HttpStatus,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

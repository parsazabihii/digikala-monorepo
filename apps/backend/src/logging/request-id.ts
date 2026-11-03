import { randomUUID } from 'node:crypto';
import { IncomingMessage } from 'node:http';

export const REQUEST_ID_HEADER = 'x-request-id';

// Letters, digits, `.`, `_` and `-`, at most 64 characters. Anything else is replaced with a
// fresh id, so a client cannot push oversized values or control characters into the logs.
const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{1,64}$/;

// Passed to FastifyAdapter as `genReqId`. Fastify stores the result as `request.id` and
// @fastify/middie copies it onto the raw request, where pino-http reuses it for the logs.
export function requestIdFrom(request: IncomingMessage): string {
  const incoming = request.headers[REQUEST_ID_HEADER];
  return typeof incoming === 'string' && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
}

import { Body, Controller, Get, HttpStatus, Post } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { z } from 'zod';

import { AppException } from './../src/common/app.exception.js';
import { ZodValidationPipe } from './../src/common/zod-validation.pipe.js';
import { createTestApp } from './create-test-app.js';

const createThingSchema = z.object({
  name: z.string().trim().min(1),
  count: z.coerce.number().int().positive(),
});

// Registered only in the test module; the app itself has no such routes.
@Controller('test-errors')
class TestErrorsController {
  @Post('things')
  create(@Body(new ZodValidationPipe(createThingSchema)) body: z.output<typeof createThingSchema>) {
    return body;
  }

  @Get('app-exception')
  appException(): never {
    throw new AppException('THING_LOCKED', HttpStatus.CONFLICT, 'Thing is locked', {
      thingId: 7,
    });
  }

  @Get('plain-error')
  plainError(): never {
    throw new Error('connection to db-internal:5432 refused');
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

describe('Validation and error format (e2e)', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    app = await createTestApp([TestErrorsController]);
  });

  it('passes a valid body through as the parsed value', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/test-errors/things',
      payload: { name: '  Lamp  ', count: '3' },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({ name: 'Lamp', count: 3 });
  });

  it('rejects an invalid body with VALIDATION_FAILED and details', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/test-errors/things',
      payload: { name: '', count: -1 },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      statusCode: 400,
      error: 'VALIDATION_FAILED',
      message: 'Request validation failed',
      details: [
        { path: 'name', message: expect.any(String) as string },
        { path: 'count', message: expect.any(String) as string },
      ],
      path: '/api/v1/test-errors/things',
      timestamp: expect.stringMatching(ISO_DATE) as string,
      requestId: expect.any(String) as string,
    });
  });

  it('reports a malformed JSON body from Fastify in the same format', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/test-errors/things',
      headers: { 'content-type': 'application/json' },
      payload: '{"name":',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ statusCode: 400, error: 'BAD_REQUEST' });
  });

  it('keeps the code, status and details of a thrown AppException', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/test-errors/app-exception' });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      statusCode: 409,
      error: 'THING_LOCKED',
      message: 'Thing is locked',
      details: { thingId: 7 },
    });
  });

  it('maps a Nest HttpException to its status and a code from its name', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/unknown' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      statusCode: 404,
      error: 'NOT_FOUND',
      path: '/api/v1/unknown',
    });
  });

  it('turns a plain Error into a generic 500 without leaking it', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/test-errors/plain-error' });

    expect(response.statusCode).toBe(500);
    const body = response.json<Record<string, unknown>>();
    expect(body).toMatchObject({
      statusCode: 500,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
    expect(body).not.toHaveProperty('details');
    expect(response.body).not.toContain('db-internal');
    expect(response.body).not.toContain('at ');
  });

  afterEach(async () => {
    await app.close();
  });
});

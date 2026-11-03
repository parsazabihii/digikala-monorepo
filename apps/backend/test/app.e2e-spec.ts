import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { createTestApp } from './create-test-app.js';

// Set as CORS_ORIGINS in vitest.config.e2e.ts.
const ALLOWED_ORIGIN = 'https://allowed.example';

describe('HTTP conventions (e2e)', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    app = await createTestApp();
  });

  it('/health (GET) is outside the prefix and versioning', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('returns 404 for an unknown /api/v1 route', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/unknown' });

    expect(response.statusCode).toBe(404);
  });

  it('sends the CORS header to an allowed origin', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: ALLOWED_ORIGIN },
    });

    expect(response.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
  });

  it('omits the CORS header for any other origin', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'https://other.example' },
    });

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  afterEach(async () => {
    await app.close();
  });
});

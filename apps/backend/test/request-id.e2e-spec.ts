import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { createTestApp } from './create-test-app.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('Request id (e2e)', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    app = await createTestApp();
  });

  it('returns a generated x-request-id', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.headers['x-request-id']).toMatch(UUID);
  });

  it('echoes back an incoming x-request-id', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { 'x-request-id': 'client-trace_42.a' },
    });

    expect(response.headers['x-request-id']).toBe('client-trace_42.a');
  });

  it('replaces an incoming x-request-id that is too long or unsafe', async () => {
    for (const unsafe of ['a'.repeat(65), 'id with spaces', 'id\\n{"level":60}']) {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: { 'x-request-id': unsafe },
      });

      expect(response.headers['x-request-id']).toMatch(UUID);
    }
  });

  it('includes the request id in error responses', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/unknown',
      headers: { 'x-request-id': 'trace-404' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.headers['x-request-id']).toBe('trace-404');
    expect(response.json()).toMatchObject({ requestId: 'trace-404' });
  });

  afterEach(async () => {
    await app.close();
  });
});

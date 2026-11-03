import { RequestMethod, Type, VersioningType } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';

import { AppModule } from './../src/app.module.js';
import { AppConfigService } from './../src/config/app-config.service.js';
import { REQUEST_ID_HEADER, requestIdFrom } from './../src/logging/request-id.js';

// Boots AppModule for the e2e tests. `controllers` are registered only in the test module,
// so tests can exercise behaviour without adding routes to the app.
export async function createTestApp(controllers: Type[] = []): Promise<NestFastifyApplication> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
    controllers,
  }).compile();

  const config = moduleFixture.get(AppConfigService);
  // Mirrors the HTTP setup in src/main.ts; keep the two in sync.
  const adapter: FastifyAdapter = new FastifyAdapter({
    trustProxy: config.get('TRUST_PROXY'),
    bodyLimit: config.get('BODY_LIMIT_BYTES'),
    genReqId: requestIdFrom,
  });
  const app = moduleFixture.createNestApplication<NestFastifyApplication>(adapter, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api', { exclude: [{ path: 'health', method: RequestMethod.GET }] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.enableCors({ origin: config.get('CORS_ORIGINS') });
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onRequest', (request, reply, done) => {
      void reply.header(REQUEST_ID_HEADER, request.id);
      done();
    });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}

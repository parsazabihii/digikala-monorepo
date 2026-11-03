import { RequestMethod, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module.js';
import { AppConfigModule } from './config/app-config.module.js';
import { AppConfigService } from './config/app-config.service.js';
import { REQUEST_ID_HEADER, requestIdFrom } from './logging/request-id.js';

async function bootstrap() {
  // Runs before pino exists, so only its warnings and errors (e.g. an invalid env) are printed.
  const configContext = await NestFactory.createApplicationContext(AppConfigModule, {
    logger: ['error', 'warn'],
  });
  const bootConfig = configContext.get(AppConfigService);

  const adapter: FastifyAdapter = new FastifyAdapter({
    trustProxy: bootConfig.get('TRUST_PROXY'),
    bodyLimit: bootConfig.get('BODY_LIMIT_BYTES'),
    genReqId: requestIdFrom,
  });
  await configContext.close();
  // bufferLogs holds the startup logs until useLogger switches Nest to the pino logger.
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: true,
  });
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.enableShutdownHooks();
  const config = app.get(AppConfigService);
  app.setGlobalPrefix('api', { exclude: [{ path: 'health', method: RequestMethod.GET }] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.enableCors({ origin: config.get('CORS_ORIGINS') });
  // onRequest runs for every request, including 404s and requests whose body fails to parse.
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onRequest', (request, reply, done) => {
      void reply.header(REQUEST_ID_HEADER, request.id);
      done();
    });
  await app.listen(config.get('PORT'), config.get('HOST'), () => {
    logger.log(`application is running on ${config.get('PORT').toString()}`, 'Bootstrap');
  });
}
await bootstrap();

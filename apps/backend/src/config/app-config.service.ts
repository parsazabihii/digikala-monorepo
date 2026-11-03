import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Env } from './env.schema.js';

// ConfigService<Env, true>.get(key) is typed `any` unless `{ infer: true }` is passed.
// This wrapper makes `get('PORT')` return `number` without it.
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get<K extends keyof Env>(key: K): Env[K] {
    return this.config.get<Env[K]>(key);
  }
}

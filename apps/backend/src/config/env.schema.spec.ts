import { envFilePaths, MAX_BODY_LIMIT_BYTES, validateEnv } from './env.schema.js';

describe('envFilePaths', () => {
  it('loads the NODE_ENV file before .env', () => {
    expect(envFilePaths('production')).toEqual(['.env.production', '.env']);
  });
});

describe('validateEnv', () => {
  it('applies defaults to an empty env', () => {
    expect(validateEnv({})).toEqual({
      NODE_ENV: 'development',
      HOST: '0.0.0.0',
      PORT: 4000,
      CORS_ORIGINS: [],
      TRUST_PROXY: false,
      BODY_LIMIT_BYTES: 1024 * 1024,
      LOG_LEVEL: 'debug',
    });
  });

  it('defaults LOG_LEVEL to info outside development', () => {
    expect(
      validateEnv({ NODE_ENV: 'production', CORS_ORIGINS: 'https://a.example' }).LOG_LEVEL,
    ).toBe('info');
  });

  it('accepts a pino LOG_LEVEL and rejects anything else', () => {
    expect(validateEnv({ LOG_LEVEL: 'warn' }).LOG_LEVEL).toBe('warn');
    expect(() => validateEnv({ LOG_LEVEL: 'verbose' })).toThrow(/- LOG_LEVEL: /);
  });

  it('coerces PORT to a number', () => {
    expect(validateEnv({ PORT: '8080' }).PORT).toBe(8080);
  });

  it('rejects an invalid PORT with a clear message', () => {
    expect(() => validateEnv({ PORT: 'abc' })).toThrow(
      /^Invalid environment variables:\n {2}- PORT: /,
    );
  });

  it('splits CORS_ORIGINS on commas and drops empty entries', () => {
    expect(
      validateEnv({ CORS_ORIGINS: ' https://a.example , ,https://b.example,' }).CORS_ORIGINS,
    ).toEqual(['https://a.example', 'https://b.example']);
  });

  it('requires CORS_ORIGINS in production', () => {
    expect(() => validateEnv({ NODE_ENV: 'production' })).toThrow(
      /- CORS_ORIGINS: Required in production/,
    );
    expect(
      validateEnv({ NODE_ENV: 'production', CORS_ORIGINS: 'https://a.example' }).CORS_ORIGINS,
    ).toEqual(['https://a.example']);
  });

  it('parses TRUST_PROXY as a boolean string', () => {
    expect(validateEnv({ TRUST_PROXY: 'true' }).TRUST_PROXY).toBe(true);
    expect(validateEnv({ TRUST_PROXY: 'false' }).TRUST_PROXY).toBe(false);
    expect(() => validateEnv({ TRUST_PROXY: 'maybe' })).toThrow(/- TRUST_PROXY: /);
  });

  it('accepts a BODY_LIMIT_BYTES up to the cap', () => {
    expect(validateEnv({ BODY_LIMIT_BYTES: '65536' }).BODY_LIMIT_BYTES).toBe(65536);
    expect(validateEnv({ BODY_LIMIT_BYTES: String(MAX_BODY_LIMIT_BYTES) }).BODY_LIMIT_BYTES).toBe(
      MAX_BODY_LIMIT_BYTES,
    );
  });

  it('rejects a BODY_LIMIT_BYTES above the cap', () => {
    expect(() => validateEnv({ BODY_LIMIT_BYTES: String(MAX_BODY_LIMIT_BYTES + 1) })).toThrow(
      /- BODY_LIMIT_BYTES: /,
    );
  });

  it('lists every invalid variable', () => {
    expect(() => validateEnv({ NODE_ENV: 'staging', PORT: '70000' })).toThrow(
      /- NODE_ENV: .+\n {2}- PORT: /,
    );
  });
});

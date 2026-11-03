import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Vitest sets NODE_ENV=test, which the env schema rejects. The e2e suite boots AppModule.
    // CORS_ORIGINS is the allowed origin the CORS tests in test/app.e2e-spec.ts expect.
    // LOG_LEVEL keeps request and error logs out of the test output.
    env: { NODE_ENV: 'development', CORS_ORIGINS: 'https://allowed.example', LOG_LEVEL: 'silent' },
  },
});

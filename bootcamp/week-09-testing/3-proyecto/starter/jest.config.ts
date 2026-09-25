import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.spec.ts'],
  testTimeout: 30000,
  // Limpia llamadas y resultados de los mocks entre tests
  clearMocks: true,
  // Carga .env.test antes de importar cualquier modulo (config/env.ts exige los secretos)
  setupFiles: ['<rootDir>/src/__tests__/setup/load-env.ts'],
  // Los imports usan extension .js (estilo ESM); Jest necesita resolverlos al .ts
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
    '!src/types/**',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
};

export default config;

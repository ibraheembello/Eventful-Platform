import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts', '!src/config/**'],
  coverageDirectory: 'coverage',
  clearMocks: true,
  // uuid v10+ ships ESM only — tell Jest to transform it with ts-jest
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)',
  ],
};

export default config;

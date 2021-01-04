import type {Config} from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  collectCoverage: false,
  testMatch: ['<rootDir>/e2e/*.test.ts'],
};
export default config;

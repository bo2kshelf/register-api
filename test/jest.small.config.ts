import type {Config} from '@jest/types';
import base from './jest.base.config';

const config: Config.InitialOptions = {
  ...base,
  collectCoverage: true,
  coverageDirectory: '../coverage/small',
  testMatch: ['<rootDir>/**/test/small/*.test.ts'],
};
export default config;

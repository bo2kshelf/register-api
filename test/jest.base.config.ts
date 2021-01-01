import type {Config} from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../src',
  coveragePathIgnorePatterns: [
    '.args.ts',
    '.input.ts',
    '.enum.ts',
    '.schema.ts',
    '.entity.ts',
    '.factory.ts',
  ],
};
export default config;

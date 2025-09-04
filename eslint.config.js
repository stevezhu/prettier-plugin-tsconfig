import { defineConfig } from '@stzhu/eslint-config';
import tsConfig from '@stzhu/eslint-config/ts';
import vitestConfig from '@stzhu/eslint-config/vitest';

export default defineConfig(...tsConfig, ...vitestConfig);

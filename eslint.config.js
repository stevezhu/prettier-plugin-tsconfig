import { defineConfig, globalIgnores } from '@stzhu/eslint-config';
import tsConfig from '@stzhu/eslint-config/ts';
import vitestConfig from '@stzhu/eslint-config/vitest';

export default defineConfig(globalIgnores(['dist']), tsConfig, vitestConfig);

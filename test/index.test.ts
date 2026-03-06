import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { format } from 'prettier';
import { expect, test } from 'vitest';

import * as plugin from '../src/index.js';

test.each([
  ['sorts jsconfig', 'jsconfig.test.json'],
  ['sorts tsconfig', 'tsconfig.test.json'],
  [
    'sorts unknown fields at end in lexical order',
    'tsconfig.unknownFields.json',
  ],
  ['sorts tsconfig with comments', 'tsconfig.comments.json'],
])('%s', async (_, filename) => {
  const filepath = resolve(import.meta.dirname, 'fixtures', filename);
  const tsconfigTest = await readFile(filepath, 'utf8');
  await expect(
    // set the filepath without the '_' prefix here so that the plugin knows to format the file
    format(tsconfigTest, { filepath: `./${filename}`, plugins: [plugin], parser: 'jsonc', trailingComma: 'none' }),
  ).resolves.toMatchSnapshot(filename);
});

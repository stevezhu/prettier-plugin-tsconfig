import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { format } from 'prettier';
import { expect, test } from 'vitest';

import * as plugin from '../src/index.js';

test.each([
  ['sorts tsconfig', 'tsconfig.test.json'],
  [
    'sorts unknown fields at end in lexical order',
    'tsconfig.unknownFields.json',
  ],
])('%s', async (_, filename) => {
  // Fixtures are prefixed with an '_' so that they don't get formatted by this plugin
  const filepath = resolve(__dirname, 'fixtures', `_${filename}`);
  const tsconfigTest = await readFile(filepath, 'utf8');
  await expect(
    // set the filepath without the '_' prefix here so that the plugin knows to format the file
    format(tsconfigTest, { filepath: `./${filename}`, plugins: [plugin] }),
  ).resolves.toMatchSnapshot(filename);
});

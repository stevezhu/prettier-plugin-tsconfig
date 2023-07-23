import { load } from 'cheerio';
import { writeFile } from 'fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TSConfigSortOrderMap } from '../src/sortObjectExpression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const topLevelSelector = '.tsconfig-quick-nav:not(.grouped)';
const navSelector = '.tsconfig-quick-nav.grouped';

/**
 * Generates a json file with the sort order of the tsconfig fields by parsing
 * https://www.typescriptlang.org/tsconfig.
 */
async function generateSortOrder() {
  const html = await fetch('https://www.typescriptlang.org/tsconfig').then(
    (resp) => resp.text(),
  );
  const $ = load(html);

  const tsconfigMap: TSConfigSortOrderMap = {
    order: 0,
    fields: {
      $schema: 0,
    },
  };
  let startIndex = 1;
  $(topLevelSelector)
    .find('li code a')
    .map((i, el) => {
      tsconfigMap.fields[$(el).text()] = startIndex + i;
    });

  startIndex = Object.keys(tsconfigMap.fields).length;
  $(navSelector).each((i, navEl) => {
    const map: TSConfigSortOrderMap = {
      order: startIndex + i,
      fields: {},
    };
    $(navEl)
      .find('li code a')
      .map((i, el) => {
        map.fields[$(el).text()] = i;
      });
    tsconfigMap.fields[$(navEl).find('h4').text().replaceAll('"', '')] = map;
  });

  await writeFile(
    resolve(__dirname, '../src/__generated__/tsconfigSortOrderMap.json'),
    JSON.stringify(tsconfigMap, null, 2) + '\n',
  );
}
await generateSortOrder();

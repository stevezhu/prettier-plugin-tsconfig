import { Expression, isObjectExpression } from '@babel/types';
import { Parser, Plugin } from 'prettier';
import { parsers as babelParsers } from 'prettier/plugins/babel';

import tsconfigFieldMap from './__generated__/tsconfigSortOrderMap.json';
import { sortObjectExpression } from './sortObjectExpression.js';

type JsonRoot = {
  type: 'JsonRoot';
  node: Expression;
};

const jsoncParser = babelParsers.jsonc as Parser<JsonRoot>;

export const parsers = {
  jsonc: {
    ...jsoncParser,
    async parse(text, options) {
      const ast = await jsoncParser.parse(text, options);
      if (options.filepath.match(/[\\/][tj]sconfig(\.\w+)?\.json$/i)) {
        if (isObjectExpression(ast.node)) {
          sortObjectExpression(
            ast.node,
            tsconfigFieldMap,
            (ast as any).comments,
            text,
          );
        }
      }
      return ast;
    },
  } satisfies Parser<JsonRoot>,
} satisfies Plugin['parsers'];

import { Expression, isObjectExpression } from '@babel/types';
import { Parser, Plugin } from 'prettier';
import { parsers as babelParsers } from 'prettier/plugins/babel';
import tsconfigFieldMap from './__generated__/tsconfigSortOrderMap.json';
import { sortObjectExpression } from './sortObjectExpression.js';

type JsonRoot = {
  type: 'JsonRoot';
  node: Expression;
};

const jsonParser = babelParsers.json as Parser<JsonRoot>;

export const parsers = {
  json: {
    ...jsonParser,
    async parse(text, options) {
      const ast = await jsonParser.parse(text, options);
      if (options.filepath.match(/[\\/]tsconfig(\.\w+)?\.json$/i)) {
        if (isObjectExpression(ast.node)) {
          sortObjectExpression(ast.node, tsconfigFieldMap);
        }
      }
      return ast;
    },
  } satisfies Parser<JsonRoot>,
} satisfies Plugin['parsers'];

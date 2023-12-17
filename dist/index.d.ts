import * as prettier from 'prettier';
import { Expression } from '@babel/types';

type JsonRoot = {
    type: 'JsonRoot';
    node: Expression;
};
declare const parsers: {
    json: {
        parse(text: string, options: prettier.ParserOptions<JsonRoot>): Promise<JsonRoot>;
        astFormat: string;
        hasPragma?: ((text: string) => boolean) | undefined;
        locStart: (node: JsonRoot) => number;
        locEnd: (node: JsonRoot) => number;
        preprocess?: ((text: string, options: prettier.ParserOptions<JsonRoot>) => string) | undefined;
    };
};

export { parsers };

// src/index.ts
import { isObjectExpression as isObjectExpression2 } from "@babel/types";
import { parsers as babelParsers } from "prettier/plugins/babel";

// src/__generated__/tsconfigSortOrderMap.json
var tsconfigSortOrderMap_default = {
  order: 0,
  fields: {
    $schema: 0,
    files: 1,
    extends: 2,
    include: 3,
    exclude: 4,
    references: 5,
    compilerOptions: {
      order: 6,
      fields: {
        allowUnreachableCode: 0,
        allowUnusedLabels: 1,
        alwaysStrict: 2,
        exactOptionalPropertyTypes: 3,
        noFallthroughCasesInSwitch: 4,
        noImplicitAny: 5,
        noImplicitOverride: 6,
        noImplicitReturns: 7,
        noImplicitThis: 8,
        noPropertyAccessFromIndexSignature: 9,
        noUncheckedIndexedAccess: 10,
        noUnusedLocals: 11,
        noUnusedParameters: 12,
        strict: 13,
        strictBindCallApply: 14,
        strictFunctionTypes: 15,
        strictNullChecks: 16,
        strictPropertyInitialization: 17,
        useUnknownInCatchVariables: 18,
        allowArbitraryExtensions: 19,
        allowImportingTsExtensions: 20,
        allowUmdGlobalAccess: 21,
        baseUrl: 22,
        customConditions: 23,
        module: 24,
        moduleResolution: 25,
        moduleSuffixes: 26,
        noResolve: 27,
        paths: 28,
        resolveJsonModule: 29,
        resolvePackageJsonExports: 30,
        resolvePackageJsonImports: 31,
        rootDir: 32,
        rootDirs: 33,
        typeRoots: 34,
        types: 35,
        declaration: 36,
        declarationDir: 37,
        declarationMap: 38,
        downlevelIteration: 39,
        emitBOM: 40,
        emitDeclarationOnly: 41,
        importHelpers: 42,
        importsNotUsedAsValues: 43,
        inlineSourceMap: 44,
        inlineSources: 45,
        mapRoot: 46,
        newLine: 47,
        noEmit: 48,
        noEmitHelpers: 49,
        noEmitOnError: 50,
        outDir: 51,
        outFile: 52,
        preserveConstEnums: 53,
        preserveValueImports: 54,
        removeComments: 55,
        sourceMap: 56,
        sourceRoot: 57,
        stripInternal: 58,
        allowJs: 59,
        checkJs: 60,
        maxNodeModuleJsDepth: 61,
        disableSizeLimit: 62,
        plugins: 63,
        allowSyntheticDefaultImports: 64,
        esModuleInterop: 65,
        forceConsistentCasingInFileNames: 66,
        isolatedModules: 67,
        preserveSymlinks: 68,
        verbatimModuleSyntax: 69,
        charset: 70,
        keyofStringsOnly: 71,
        noImplicitUseStrict: 72,
        noStrictGenericChecks: 73,
        out: 74,
        suppressExcessPropertyErrors: 75,
        suppressImplicitAnyIndexErrors: 76,
        emitDecoratorMetadata: 77,
        experimentalDecorators: 78,
        jsx: 79,
        jsxFactory: 80,
        jsxFragmentFactory: 81,
        jsxImportSource: 82,
        lib: 83,
        moduleDetection: 84,
        noLib: 85,
        reactNamespace: 86,
        target: 87,
        useDefineForClassFields: 88,
        diagnostics: 89,
        explainFiles: 90,
        extendedDiagnostics: 91,
        generateCpuProfile: 92,
        listEmittedFiles: 93,
        listFiles: 94,
        traceResolution: 95,
        composite: 96,
        disableReferencedProjectLoad: 97,
        disableSolutionSearching: 98,
        disableSourceOfProjectReferenceRedirect: 99,
        incremental: 100,
        tsBuildInfoFile: 101,
        noErrorTruncation: 102,
        preserveWatchOutput: 103,
        pretty: 104,
        skipDefaultLibCheck: 105,
        skipLibCheck: 106,
        assumeChangesOnlyAffectDirectDependencies: 107
      }
    },
    watchOptions: {
      order: 7,
      fields: {
        watchFile: 0,
        watchDirectory: 1,
        fallbackPolling: 2,
        synchronousWatchDirectory: 3,
        excludeDirectories: 4,
        excludeFiles: 5
      }
    },
    typeAcquisition: {
      order: 8,
      fields: {
        enable: 0,
        include: 1,
        exclude: 2,
        disableFilenameBasedTypeAcquisition: 3
      }
    }
  }
};

// src/sortObjectExpression.ts
import {
  isObjectExpression,
  isObjectProperty,
  isStringLiteral
} from "@babel/types";
var isStringLiteralObjectProperty = (property) => isObjectProperty(property) && isStringLiteral(property.key);
var getSortOrder = (sortOrderMap, property) => {
  if (isStringLiteralObjectProperty(property)) {
    const val = sortOrderMap.fields[property.key.value];
    if (val !== void 0) {
      return typeof val === "number" ? val : val.order;
    }
  }
  return Number.POSITIVE_INFINITY;
};
var sortObjectExpression = (node, sortOrderMap) => {
  for (const property of node.properties) {
    if (isStringLiteralObjectProperty(property)) {
      const childSortOrderMap = sortOrderMap.fields[property.key.value];
      if (isObjectExpression(property.value)) {
        sortObjectExpression(
          property.value,
          childSortOrderMap !== void 0 && typeof childSortOrderMap !== "number" ? childSortOrderMap : (
            // if the field isn't found, still pass a dummy `sortOrderMap` because we still want
            // to sort the rest of the nested properties in lexical order
            { order: 0, fields: {} }
          )
        );
      }
    }
  }
  node.properties.sort((a, b) => {
    if (isStringLiteralObjectProperty(a) && isStringLiteralObjectProperty(b) && !(a.key.value in sortOrderMap.fields) && !(b.key.value in sortOrderMap.fields)) {
      return a.key.value.localeCompare(b.key.value);
    }
    return getSortOrder(sortOrderMap, a) - getSortOrder(sortOrderMap, b);
  });
  delete node.start;
  delete node.end;
  delete node.loc;
};

// src/index.ts
var jsonParser = babelParsers.json;
var parsers = {
  json: {
    ...jsonParser,
    async parse(text, options) {
      const ast = await jsonParser.parse(text, options);
      if (options.filepath.match(/[\\/]tsconfig(\.\w+)?\.json$/i)) {
        if (isObjectExpression2(ast.node)) {
          sortObjectExpression(ast.node, tsconfigSortOrderMap_default);
        }
      }
      return ast;
    }
  }
};
export {
  parsers
};
//# sourceMappingURL=index.js.map
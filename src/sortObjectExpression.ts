import {
  ObjectExpression,
  ObjectProperty,
  StringLiteral,
  isObjectExpression,
  isObjectProperty,
  isStringLiteral,
} from '@babel/types';

export type TSConfigSortOrderMap = {
  order: number;
  fields: Record<string, number | TSConfigSortOrderMap>;
};

type ObjectExpressionProperty = ObjectExpression['properties'][number];

interface StringLiteralObjectProperty extends ObjectProperty {
  key: StringLiteral;
}

const isStringLiteralObjectProperty = (
  property: ObjectExpressionProperty,
): property is StringLiteralObjectProperty =>
  isObjectProperty(property) && isStringLiteral(property.key);

const getSortOrder = (
  sortOrderMap: TSConfigSortOrderMap,
  property: ObjectExpressionProperty,
): number => {
  if (isStringLiteralObjectProperty(property)) {
    const val = sortOrderMap.fields[property.key.value];
    if (val !== undefined) {
      return typeof val === 'number' ? val : val.order;
    }
  }
  return Number.POSITIVE_INFINITY;
};

export const sortObjectExpression = (
  node: ObjectExpression,
  sortOrderMap: TSConfigSortOrderMap,
) => {
  // traverse children
  for (const property of node.properties) {
    if (isStringLiteralObjectProperty(property)) {
      const childSortOrderMap = sortOrderMap.fields[property.key.value];
      if (isObjectExpression(property.value)) {
        sortObjectExpression(
          property.value,
          childSortOrderMap !== undefined &&
            typeof childSortOrderMap !== 'number'
            ? childSortOrderMap
            : // if the field isn't found, still pass a dummy `sortOrderMap` because we still want
              // to sort the rest of the nested properties in lexical order
              { order: 0, fields: {} },
        );
      }
    }
  }

  // sort properties
  node.properties.sort((a, b) => {
    if (
      isStringLiteralObjectProperty(a) &&
      isStringLiteralObjectProperty(b) &&
      !(a.key.value in sortOrderMap.fields) &&
      !(b.key.value in sortOrderMap.fields)
    ) {
      return a.key.value.localeCompare(b.key.value);
    }
    return getSortOrder(sortOrderMap, a) - getSortOrder(sortOrderMap, b);
  });

  // delete location data
  delete node.start;
  delete node.end;
  delete node.loc;
};

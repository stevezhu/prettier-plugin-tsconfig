import {
  isObjectExpression,
  isObjectProperty,
  isStringLiteral,
  ObjectExpression,
  ObjectProperty,
  StringLiteral,
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

interface CommentLike {
  start?: number | null;
  end?: number | null;
  loc?: unknown;
}

/**
 * For a given ObjectExpression, find comments from the root comments array
 * that sit at this nesting level (between properties, not inside a property's range).
 * Map each comment to the property it precedes (by original position).
 */
const mapCommentsToProperties = (
  node: ObjectExpression,
  allComments: CommentLike[],
): Map<ObjectExpressionProperty, CommentLike[]> => {
  const result = new Map<ObjectExpressionProperty, CommentLike[]>();
  const nodeStart = node.start ?? 0;
  const nodeEnd = node.end ?? Infinity;

  for (const comment of allComments) {
    const cs = comment.start ?? -1;
    if (cs <= nodeStart || cs >= nodeEnd) continue;

    // Skip comments inside a property's range (they belong to a deeper level)
    let insideProperty = false;
    for (const prop of node.properties) {
      if (cs >= (prop.start ?? 0) && cs <= (prop.end ?? 0)) {
        insideProperty = true;
        break;
      }
    }
    if (insideProperty) continue;

    // Find the first property starting after this comment
    let followingProp: ObjectExpressionProperty | undefined;
    for (const prop of node.properties) {
      if (
        (prop.start ?? 0) > cs &&
        (!followingProp || (prop.start ?? 0) < (followingProp.start ?? 0))
      ) {
        followingProp = prop;
      }
    }

    if (followingProp) {
      let list = result.get(followingProp);
      if (!list) {
        list = [];
        result.set(followingProp, list);
      }
      list.push(comment);
    }
  }

  return result;
};

/**
 * Pass 1: Sort all ObjectExpressions recursively and build comment maps.
 */
const sortRecursive = (
  node: ObjectExpression,
  sortOrderMap: TSConfigSortOrderMap,
  allComments: CommentLike[],
  commentMaps: Map<ObjectExpression, Map<ObjectExpressionProperty, CommentLike[]>>,
) => {
  // Build comment map BEFORE sorting (uses original positions)
  const commentMap = mapCommentsToProperties(node, allComments);
  commentMaps.set(node, commentMap);

  // Traverse children
  for (const property of node.properties) {
    if (isStringLiteralObjectProperty(property)) {
      const childSortOrderMap = sortOrderMap.fields[property.key.value];
      if (isObjectExpression(property.value)) {
        sortRecursive(
          property.value,
          childSortOrderMap !== undefined &&
            typeof childSortOrderMap !== 'number'
            ? childSortOrderMap
            : { order: 0, fields: {} },
          allComments,
          commentMaps,
        );
      }
    }
  }

  // Sort properties
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
};

const setFakePos = (
  n: { start?: number | null; end?: number | null; loc?: unknown },
  start: number,
  end: number,
) => {
  n.start = start;
  n.end = end;
  delete n.loc;
};

/**
 * Build an array of character offsets where each line starts in the original text.
 */
const buildLineStarts = (text: string): number[] => {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') {
      starts.push(i + 1);
    }
  }
  return starts;
};

/**
 * Pass 2: Assign positions using line-start offsets from the original text.
 * Each node/comment gets a position at the start of a different line, ensuring
 * Prettier sees newlines between them and treats comments as leading (own-line).
 * Returns the next available line index.
 */
const assignPositions = (
  node: ObjectExpression,
  commentMaps: Map<ObjectExpression, Map<ObjectExpressionProperty, CommentLike[]>>,
  lineStarts: number[],
  lineIndex: number,
): number => {
  const commentMap = commentMaps.get(node);
  const nodeStartLine = lineIndex;
  lineIndex++; // opening brace

  for (const property of node.properties) {
    // Position comments that precede this property
    const propComments = commentMap?.get(property);
    if (propComments) {
      propComments.sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
      for (const comment of propComments) {
        const pos = lineStarts[lineIndex] ?? lineIndex * 100;
        setFakePos(comment, pos, pos + 1);
        lineIndex++;
      }
    }

    const propStartPos = lineStarts[lineIndex] ?? lineIndex * 100;

    if (property.type === 'ObjectProperty') {
      const prop = property as ObjectProperty;
      setFakePos(prop.key, propStartPos, propStartPos + 1);

      if (isObjectExpression(prop.value)) {
        lineIndex = assignPositions(prop.value, commentMaps, lineStarts, lineIndex);
      } else {
        setFakePos(prop.value, propStartPos + 2, propStartPos + 3);
        lineIndex++;
      }
    } else {
      lineIndex++;
    }

    const propEndPos = lineStarts[lineIndex] ?? lineIndex * 100;
    setFakePos(property, propStartPos, propEndPos);
  }

  lineIndex++; // closing brace
  const nodeStartPos = lineStarts[nodeStartLine] ?? nodeStartLine * 100;
  const nodeEndPos = lineStarts[lineIndex] ?? lineIndex * 100;
  setFakePos(node, nodeStartPos, nodeEndPos);
  return lineIndex;
};

export const sortObjectExpression = (
  node: ObjectExpression,
  sortOrderMap: TSConfigSortOrderMap,
  allComments?: CommentLike[],
  originalText?: string,
) => {
  const commentMaps = new Map<
    ObjectExpression,
    Map<ObjectExpressionProperty, CommentLike[]>
  >();

  // Pass 1: Sort all levels and build comment maps (uses original positions)
  sortRecursive(node, sortOrderMap, allComments ?? [], commentMaps);

  // Pass 2: Assign positions using line-start offsets from original text
  const lineStarts = buildLineStarts(originalText ?? '');
  assignPositions(node, commentMaps, lineStarts, 0);
};

import { query } from "kitsu-core";
import {
  AND_KEY,
  FilterKeywordOptions,
  FilterOperation,
  OR_KEY,
  SimpleSearchFilter,
  SimpleSearchFilterCondition,
  SimpleSearchFilterValue,
  filterKeywordPositions,
  formatInList,
  isEmptyInList,
  isPlainFilterValue
} from "./simpleSearchFilterBuilder";

/**
 * Serializes a {@link SimpleSearchFilter} to the back-end's simple filter query string syntax:
 *
 *   { name: { ILIKE: "%a%" }, group: { EQ: "b" } }
 *   => filter[name][ILIKE]=%25a%25&filter[group][EQ]=b
 *
 * Groups use the grouped syntax:
 *
 *   { $or: [{ a: { EQ: 1 } }, { b: { EQ: 2 } }], c: { EQ: 3 } }
 *   => (filter[a][EQ]=1|filter[b][EQ]=2)&filter[c][EQ]=3
 *
 * Single-field OR groups with compatible operators serialize as comma-separated lists:
 *
 *   { $or: [{ a: { ILIKE: "%x%" } }, { a: { ILIKE: "%y%" } }] }
 *   => filter[a][ILIKE]=%x%,%y%
 *
 * Drop-in replacement for kitsu's serializer. Unmodeled shapes (lists, deep filters) are
 * delegated to kitsu. Non-plain values are normalized via {@link sendableCondition};
 * filters with `NOT_ILIKE` should be routed through `filterOrFiqlParams`.
 *
 * @param filter The filter to serialize.
 * @param paramName The query parameter name, "filter" by default.
 */
export function simpleSearchFilterToQueryString(
  filter: SimpleSearchFilter | null | undefined,
  paramName = "filter"
): string {
  if (!filter || typeof filter !== "object") {
    return "";
  }
  const terms = filterToTerms(filter, paramName);
  return terms.length ? joinTerms(terms, "&").text : "";
}

/**
 * Drop-in replacement for kitsu's default query serializer. Params are serialized
 * as kitsu-core does except for the `filter` object which is serialized
 * by {@link simpleSearchFilterToQueryString} to support grouped filters.
 */
export function serializeKitsuParams(params: Record<string, any>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params ?? {})) {
    if (key === "filter" && value !== null && typeof value === "object") {
      parts.push(simpleSearchFilterToQueryString(value, key));
    } else {
      parts.push(query({ [key]: value }));
    }
  }
  return parts.filter(Boolean).join("&");
}

interface QueryStringTerm {
  text: string;
  /** True if the term joins several conditions and needs parentheses next to siblings. */
  compound: boolean;
}

/** A condition as it is sent: its operator and value, before encoding. */
interface SentCondition {
  op: string;
  value: string;
}

/** Quoted empty string (`""`), used so an empty value does not consume the following parameter. */
const QUOTED_BLANK = '""';

/** URL-encodes a query string component, including `(` and `)` so raw parentheses only delimit groups. */
function encodePart(value: string): string {
  return encodeURIComponent(value).replace(/\(/g, "%28").replace(/\)/g, "%29");
}

/** Serializes values kitsu understands but this serializer does not model (lists, deep objects). */
function kitsuTerm(
  paramName: string,
  field: string,
  value: unknown
): QueryStringTerm {
  return {
    // Kitsu never emits brackets itself so encoding them only affects values:
    text: query({ [field]: value }, paramName)
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29"),
    compound: false
  };
}

const isScalar = (value: unknown) =>
  value === null || typeof value !== "object";

/** True for a condition this serializer models: { OPERATOR: value or list of values }. */
function isFlatCondition(value: object): boolean {
  return (
    !Array.isArray(value) &&
    Object.values(value).every((opValue) =>
      Array.isArray(opValue) ? opValue.every(isScalar) : isScalar(opValue)
    )
  );
}

/**
 * Replaces disallowed characters and the leading character of any filter grammar keywords
 * with `replacement` until no keywords remain.
 */
export function replaceUnreadable(
  value: string,
  isReadable: (character: string) => boolean,
  replacement: string,
  options?: FilterKeywordOptions
): string {
  let readable = Array.from(value, (character) =>
    isReadable(character) ? character : replacement
  ).join("");
  // Keywords are ASCII and replacement is a single character, so positions match UTF-16 indices
  for (
    let positions = filterKeywordPositions(readable, options);
    positions.length;
    positions = filterKeywordPositions(readable, options)
  ) {
    const units = readable.split("");
    for (const position of positions) {
      units[position] = replacement;
    }
    readable = units.join("");
  }
  return readable;
}

/**
 * Parses a comma-separated `IN` list into individual values, unquoting quoted items,
 * unescaping `\\` and `\"`, trimming unquoted items, and omitting empty values.
 */
export function parseInList(list: string): string[] {
  const values: string[] = [];
  let index = 0;
  while (index < list.length) {
    let value = "";
    while (list[index] === " ") {
      index++;
    }
    if (list[index] === '"') {
      for (index++; index < list.length && list[index] !== '"'; index++) {
        if (list[index] === "\\" && /[\\"]/.test(list[index + 1] ?? "")) {
          index++;
        }
        value += list[index];
      }
      // Skip the closing quote and anything up to the comma
      while (index < list.length && list[index] !== ",") {
        index++;
      }
    } else {
      while (index < list.length && list[index] !== ",") {
        value += list[index++];
      }
      value = value.trim();
    }
    if (value) {
      values.push(value);
    }
    // Skip the comma
    index++;
  }
  return values;
}

/**
 * Normalizes a condition's operator and value so the back-end parser reads the value intact.
 * - `EQ`: converts non-plain or empty values to quoted `IN` values.
 * - `IN`: formats list items via {@link formatInList}, falling back to `""` when all items are blank.
 * - `LIKE` / `ILIKE`: converts `*` to `%`, lowercases ASCII letters for `ILIKE`, and replaces non-plain characters with `_`.
 * - `NEQ` and other operators: replaces non-plain characters with `_` (using non-legacy lexer rules for `NEQ`), or `""` if empty.
 */
function sendableCondition(
  op: string,
  value: SimpleSearchFilterValue | undefined
): SentCondition {
  // Match kitsu-core by serializing null as "null"
  const text = value === null ? "null" : String(value);
  switch (op) {
    case "IN":
      return { op, value: formatInList(parseInList(text)) || QUOTED_BLANK };
    case "EQ":
      if (isPlainFilterValue(text)) {
        return { op, value: text };
      }
      return { op: "IN", value: text ? formatInList([text]) : QUOTED_BLANK };
    case "LIKE":
    case "ILIKE":
    case "NOT_ILIKE":
      if (!text) {
        // Preserve NOT_ILIKE operator; empty LIKE/ILIKE uses IN ""
        return { op: op === "NOT_ILIKE" ? op : "IN", value: QUOTED_BLANK };
      }
      return {
        op,
        value: replaceUnreadable(
          (op === "LIKE"
            ? text
            : text.replace(/[A-Z]+/g, (letters) => letters.toLowerCase())
          ).replace(/\*/g, "%"),
          isPlainFilterValue,
          "_"
        )
      };
    case "NEQ":
      // Check NEQ against non-legacy lexer rules so valid identifiers (e.g. a_IN) are not altered
      return {
        op,
        value: !text
          ? QUOTED_BLANK
          : isPlainFilterValue(text, { legacyLexer: false })
          ? text
          : replaceUnreadable(text, isPlainFilterValue, "_")
      };
    default:
      return {
        op,
        value: text
          ? replaceUnreadable(text, isPlainFilterValue, "_")
          : QUOTED_BLANK
      };
  }
}

function conditionTerm(
  paramName: string,
  field: string,
  { op, value }: SentCondition
): QueryStringTerm {
  return {
    text: `${encodePart(`${paramName}[${field}][${op}]`)}=${encodePart(value)}`,
    compound: false
  };
}

/** Serializes a field condition into query string terms (emitting one parameter per array element). */
function conditionTerms(
  paramName: string,
  field: string,
  op: FilterOperation,
  value: SimpleSearchFilterValue | SimpleSearchFilterValue[] | undefined
): QueryStringTerm[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      conditionTerms(
        paramName,
        field,
        op,
        op === "IN" ? formatInList([item]) : item
      )
    );
  }
  return [conditionTerm(paramName, field, sendableCondition(op, value))];
}

/** Returns a filter's only condition as [field, operator, value], if it has exactly one. */
function singleCondition(
  filter: SimpleSearchFilter
): [string, string, SimpleSearchFilterValue | undefined] | undefined {
  const fields = Object.entries(filter).filter(
    ([, value]) => value !== undefined
  );
  if (fields.length !== 1) {
    return undefined;
  }
  const [field, condition] = fields[0];
  if (
    field === OR_KEY ||
    field === AND_KEY ||
    condition === null ||
    typeof condition !== "object" ||
    Array.isArray(condition)
  ) {
    return undefined;
  }
  const operations = Object.entries(condition).filter(
    ([, opValue]) => opValue !== undefined
  );
  if (operations.length !== 1 || !isScalar(operations[0][1])) {
    return undefined;
  }
  const [op, opValue] = operations[0];
  return [field, op, opValue as SimpleSearchFilterValue];
}

/** Collapses a single-field OR group into a comma-separated condition (`filter[field][OP]=a,b`). */
function commaListTerm(
  members: SimpleSearchFilter[],
  paramName: string
): QueryStringTerm | undefined {
  const conditions = members.map(singleCondition);
  const field = conditions[0]?.[0];
  if (conditions.some((condition) => !condition || condition[0] !== field)) {
    return undefined;
  }
  const sent = conditions.map((condition) =>
    sendableCondition(condition![1], condition![2])
  );
  const ops = new Set(sent.map((condition) => condition.op));
  if (ops.size === 1) {
    return conditionTerm(paramName, field as string, {
      op: sent[0].op,
      value: sent.map((condition) => condition.value).join(",")
    });
  }
  if ([...ops].every((op) => op === "EQ" || op === "IN")) {
    return conditionTerm(paramName, field as string, {
      op: "IN",
      // An equality is quoted as needed in a list (see formatInList)
      value: sent
        .map((condition) =>
          condition.op === "EQ"
            ? formatInList([condition.value])
            : condition.value
        )
        .join(",")
    });
  }
  return undefined;
}

/** Serializes an OR group as a comma list if possible, or as a parenthesized `|`-delimited group. */
function orGroupTerm(
  members: SimpleSearchFilter[],
  paramName: string
): QueryStringTerm | undefined {
  const memberTerms = members
    .map((member) => ({ member, terms: filterToTerms(member, paramName) }))
    // Members without conditions are left out
    .filter(({ terms }) => terms.length);
  if (!memberTerms.length) {
    return undefined;
  }
  if (memberTerms.length === 1) {
    return joinTerms(memberTerms[0].terms, "&");
  }
  return (
    commaListTerm(
      memberTerms.map(({ member }) => member),
      paramName
    ) ?? {
      text: `(${
        joinTerms(
          memberTerms.map(({ terms }) => joinTerms(terms, "&")),
          "|"
        ).text
      })`,
      compound: false
    }
  );
}

/** Returns the AND-ed terms of a filter. */
function filterToTerms(
  filter: SimpleSearchFilter,
  paramName: string
): QueryStringTerm[] {
  const terms: QueryStringTerm[] = [];

  for (const [key, value] of Object.entries(filter)) {
    if (value === undefined) {
      continue;
    }

    if (key === OR_KEY) {
      const group = orGroupTerm(value as SimpleSearchFilter[], paramName);
      if (group) {
        terms.push(group);
      }
      continue;
    }

    if (key === AND_KEY) {
      // The parent is already an AND so member terms are added directly:
      for (const member of value as SimpleSearchFilter[]) {
        terms.push(...filterToTerms(member, paramName));
      }
      continue;
    }

    // Serialize operator-less values raw (filter[name]=value) for endpoints like audit-snapshot
    if (value === null || typeof value !== "object") {
      terms.push({
        text: `${encodePart(`${paramName}[${key}]`)}=${encodePart(
          String(value)
        )}`,
        compound: false
      });
      continue;
    }

    // A field holding a list is kitsu's to serialize:
    if (Array.isArray(value)) {
      terms.push(kitsuTerm(paramName, key, value));
      continue;
    }

    // An empty IN list has nothing to match on and emitting it matches only blank values.
    const conditions = (
      Object.entries(value as SimpleSearchFilterCondition) as [
        FilterOperation,
        SimpleSearchFilterValue | SimpleSearchFilterValue[] | undefined
      ][]
    ).filter(
      ([op, opValue]) => opValue !== undefined && !isEmptyInList(op, opValue)
    );
    if (!conditions.length) {
      continue;
    }

    // Deeper nesting is kitsu's to serialize
    if (!isFlatCondition(Object.fromEntries(conditions))) {
      terms.push(kitsuTerm(paramName, key, Object.fromEntries(conditions)));
      continue;
    }

    for (const [op, opValue] of conditions) {
      terms.push(...conditionTerms(paramName, key, op, opValue));
    }
  }

  return terms;
}

function joinTerms(
  terms: QueryStringTerm[],
  separator: "&" | "|"
): QueryStringTerm {
  if (terms.length === 1) {
    return terms[0];
  }
  return {
    text: terms
      .map((term) => (term.compound ? `(${term.text})` : term.text))
      .join(separator),
    compound: true
  };
}

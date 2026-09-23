import { query } from "kitsu-core";
import {
  AND_KEY,
  FilterOperation,
  OR_KEY,
  SimpleSearchFilter,
  SimpleSearchFilterCondition,
  SimpleSearchFilterValue,
  isEmptyInList
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
 * This is a drop-in for kitsu's own serializer. Anything it does not model (arrays, deep filters)
 * is handed back to kitsu. Blank or null values are serialized to keep request shapes consistent.
 *
 * Unsupported simple filter values are passed through. For example, `NOT_ILIKE` is emitted
 * as `filter[field][NOT_ILIKE]=...` and a null value as `null` for the server to intercept.
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

/**
 * "(" and ")" delimit groups and kitsu's encodeURIComponent leaves them unencoded.
 * They are encoded here so the back-end can decode them back after splitting on delimiters.
 */
function encodePart(value: string): string {
  return encodeURIComponent(value).replace(/\(/g, "%28").replace(/\)/g, "%29");
}

/** Serializes values kitsu understands but this serializer does not model (arrays, deep objects). */
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

/** True for a condition this serializer models: a flat { OPERATOR: scalar } object. */
function isFlatCondition(value: object): boolean {
  return (
    !Array.isArray(value) &&
    Object.values(value).every(
      (opValue) => opValue === null || typeof opValue !== "object"
    )
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
      const members = (value as SimpleSearchFilter[])
        .map((member) => filterToTerms(member, paramName))
        // Members without conditions widen the group to match anything:
        .filter((memberTerms) => memberTerms.length)
        .map((memberTerms) => joinTerms(memberTerms, "&"));
      if (members.length === 1) {
        terms.push(members[0]);
      } else if (members.length > 1) {
        // An OR group is always parenthesized to avoid confusion with "&"-separated params:
        terms.push({
          text: `(${joinTerms(members, "|").text})`,
          compound: false
        });
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

    // Plain operator-less values serialize as kitsu does:
    // filter[name]=value
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

    // Arrays and deeper nesting are kitsu's to serialize:
    if (!isFlatCondition(Object.fromEntries(conditions))) {
      terms.push(kitsuTerm(paramName, key, Object.fromEntries(conditions)));
      continue;
    }

    for (const [op, opValue] of conditions) {
      terms.push({
        text: conditionToQueryString(
          paramName,
          key,
          op,
          opValue as SimpleSearchFilterValue
        ),
        compound: false
      });
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

function conditionToQueryString(
  paramName: string,
  field: string,
  op: FilterOperation,
  value: SimpleSearchFilterValue | SimpleSearchFilterValue[]
): string {
  // Same key/value encoding as kitsu-core:
  // Null values are serialized as the string "null" for the server side to intercept.
  const serializedValue = value === null ? "null" : String(value);
  return `${encodePart(`${paramName}[${field}][${op}]`)}=${encodePart(
    serializedValue
  )}`;
}

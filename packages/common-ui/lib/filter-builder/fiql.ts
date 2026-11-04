import { FilterParam } from "kitsu";
import {
  AND_KEY,
  FilterOperation,
  OR_KEY,
  SimpleSearchFilter,
  SimpleSearchFilterCondition,
  SimpleSearchFilterValue,
  isEmptyInList,
  isEmptySimpleSearchFilter
} from "../util/simpleSearchFilterBuilder";
import {
  parseInList,
  replaceUnreadable
} from "../util/simpleSearchFilterQueryString";
import {
  FilterModel,
  filterModelToSimpleSearchFilter
} from "./filterModelToSimpleSearchFilter";

/**
 * Returns `{ filter }` for standard filters, `{ fiql }` when the filter contains a negated
 * pattern (`NOT_ILIKE` or `NEQ` with `*`), or `{}` if the filter is empty.
 */
export function filterOrFiqlParams(
  filter: SimpleSearchFilter | null | undefined
): { filter?: SimpleSearchFilter; fiql?: string } {
  if (!filter || isEmptySimpleSearchFilter(filter)) {
    return {};
  }
  return hasNegatedPattern(filter)
    ? { fiql: simpleSearchFilterToFiql(filter) }
    : { filter };
}

/** True if the filter has a NOT_ILIKE condition or a NEQ containing "*", in any group. */
function hasNegatedPattern(filter: SimpleSearchFilter): boolean {
  return Object.entries(filter).some(([key, value]) => {
    if (key === OR_KEY || key === AND_KEY) {
      return (
        Array.isArray(value) &&
        (value as SimpleSearchFilter[]).some(hasNegatedPattern)
      );
    }
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return false;
    }
    const { NOT_ILIKE, NEQ } = value as SimpleSearchFilterCondition;
    // An "IS NOT" + "Exact Match" with "*" is a negated pattern too
    return (
      NOT_ILIKE !== undefined || (typeof NEQ === "string" && NEQ.includes("*"))
    );
  });
}

/** Characters permitted unquoted in a FIQL argument. */
const FIQL_ARGUMENT_CHARACTER = /^[\p{L}0-9_\-.%/: !=*]$/u;

/**
 * Formats a value as a FIQL argument, replacing disallowed characters and filter keywords with `*`.
 * Quotes the value instead if negated or if replacement would reduce it to only `*` wildcards.
 */
export function fiqlArgument(value: string, negated = false): string {
  const argument = replaceUnreadable(
    value,
    (character) => FIQL_ARGUMENT_CHARACTER.test(character),
    "*",
    // Skip legacy lexer rules when negated so valid identifiers (e.g. a_IN) are not quoted
    { legacyLexer: !negated }
  );
  return (negated || /^\*+$/.test(argument)) && argument !== value
    ? `"${value.replace(/"/g, "")}"`
    : argument;
}

/**
 * Converts a {@link SimpleSearchFilter} to a FIQL expression:
 *
 *   { name: { ILIKE: "%a%" }, $or: [{ group: { EQ: "b" } }, { group: { EQ: "c" } }] }
 *   => name==*a*;(group==b,group==c)
 *
 * This is the only place FIQL should be produced. Use it through {@link filterOrFiqlParams}.
 */
export function simpleSearchFilterToFiql(
  filter: FilterParam | SimpleSearchFilter | null | undefined
): string {
  if (!filter || typeof filter !== "object") {
    return "";
  }
  const terms = filterToTerms(filter as SimpleSearchFilter);
  return terms.length ? joinTerms(terms, ";").text : "";
}

/** Converts a filter builder or free-text search model to a FIQL expression. */
export function fiql(filter: FilterModel | null | undefined): string {
  return simpleSearchFilterToFiql(filterModelToSimpleSearchFilter(filter));
}

interface FiqlTerm {
  text: string;
  /** True if the term joins several conditions and needs parentheses next to siblings. */
  compound: boolean;
}

/** Returns the AND-ed terms of a filter. */
function filterToTerms(filter: SimpleSearchFilter): FiqlTerm[] {
  const terms: FiqlTerm[] = [];

  for (const [key, value] of Object.entries(filter)) {
    if (value === undefined) {
      continue;
    }

    if (key === OR_KEY) {
      const members = (value as SimpleSearchFilter[])
        .map((member) => filterToTerms(member))
        // Members without conditions widen the group and render as empty "()" which the parser rejects.
        .filter((memberTerms) => memberTerms.length)
        .map((memberTerms) => joinTerms(memberTerms, ";"));
      if (members.length) {
        terms.push(joinTerms(members, ","));
      }
      continue;
    }

    if (key === AND_KEY) {
      // The parent is already an AND so member terms are added directly.
      for (const member of value as SimpleSearchFilter[]) {
        terms.push(...filterToTerms(member));
      }
      continue;
    }

    // Plain values are equalities and blank ones are ignored. A null value searches for a blank field.
    if (value === null || typeof value !== "object") {
      if (value !== "") {
        terms.push(conditionToFiql(key, "EQ", value));
      }
      continue;
    }

    for (const [op, opValue] of Object.entries(
      value as SimpleSearchFilterCondition
    ) as [
      FilterOperation,
      SimpleSearchFilterValue | SimpleSearchFilterValue[] | undefined
    ][]) {
      // Empty IN lists have nothing to compare against. Emitting them produces invalid syntax.
      if (opValue !== undefined && !isEmptyInList(op, opValue)) {
        terms.push(conditionToFiql(key, op, opValue));
      }
    }
  }

  return terms;
}

function joinTerms(terms: FiqlTerm[], separator: ";" | ","): FiqlTerm {
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

function conditionToFiql(
  field: string,
  op: FilterOperation,
  value: SimpleSearchFilterValue | SimpleSearchFilterValue[]
): FiqlTerm {
  switch (op) {
    case "EQ":
      return { text: `${field}==${argument(value)}`, compound: false };
    case "NEQ":
      return { text: `${field}!=${argument(value, true)}`, compound: false };
    case "LIKE":
    case "ILIKE":
      return { text: `${field}==${wildcardArgument(value)}`, compound: false };
    case "NOT_ILIKE":
      return {
        text: `${field}!=${wildcardArgument(value, true)}`,
        compound: false
      };
    case "GT":
      return {
        text: `${field}=gt=${comparedArgument(value)}`,
        compound: false
      };
    case "GOE":
      return {
        text: `${field}=ge=${comparedArgument(value)}`,
        compound: false
      };
    case "LT":
      return {
        text: `${field}=lt=${comparedArgument(value)}`,
        compound: false
      };
    case "LOE":
      return {
        text: `${field}=le=${comparedArgument(value)}`,
        compound: false
      };
    case "IN": {
      // FIQL has no "in" operator so IN becomes an OR of equalities. Values are arrays or IN lists.
      const values = Array.isArray(value) ? value : parseInList(String(value));
      return joinTerms(
        values.map((val) => ({
          text: `${field}==${argument(val)}`,
          compound: false
        })),
        ","
      );
    }
  }
}

function argument(
  value: SimpleSearchFilterValue | SimpleSearchFilterValue[],
  negated = false
): string {
  if (value === null) {
    return "null";
  }
  return fiqlArgument(String(value), negated);
}

/** LIKE and ILIKE values use "%" as the wildcard whereas FIQL uses "*". */
function wildcardArgument(
  value: SimpleSearchFilterValue | SimpleSearchFilterValue[],
  negated = false
): string {
  return typeof value === "string"
    ? fiqlArgument(value.replace(/%/g, "*"), negated)
    : argument(value, negated);
}

/** Converts UTC ISO timestamps (`...Z`) to `-00:00` offset without milliseconds for FIQL compatibility. */
function comparedArgument(
  value: SimpleSearchFilterValue | SimpleSearchFilterValue[]
): string {
  return argument(
    typeof value === "string"
      ? value.replace(/^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)(\.\d+)?Z$/, "$1-00:00")
      : value
  );
}

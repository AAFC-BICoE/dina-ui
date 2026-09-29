import { FilterParam } from "kitsu";
import {
  AND_KEY,
  FilterOperation,
  OR_KEY,
  SimpleSearchFilter,
  SimpleSearchFilterCondition,
  SimpleSearchFilterValue,
  isEmptyInList
} from "../util/simpleSearchFilterBuilder";
import {
  FilterModel,
  filterModelToSimpleSearchFilter
} from "./filterModelToSimpleSearchFilter";

/**
 * Characters that end a FIQL argument: "," and ";" join conditions and "(" ")" group them.
 * The back-end rejects an unquoted argument containing one of them.
 */
const FIQL_RESERVED_CHARACTERS = /[(),;]/;

/**
 * Returns a value as a FIQL argument.
 *
 * Values are sent unquoted, the back-end accepts spaces and accented letters. 
 * But it keeps double quotes as part of the value, so a quoted argument never matches anything. 
 * Values containing reserved characters are quoted only to avoid a syntax error and cannot match 
 * (the back-end also splits "," and ";" before it reads quotes, so those are rejected either way).
 * Double quotes cannot be escaped and are dropped from quoted values.
 */
export function fiqlArgument(value: string): string {
  return FIQL_RESERVED_CHARACTERS.test(value)
    ? `"${value.replace(/"/g, "")}"`
    : value;
}

/**
 * Converts a {@link SimpleSearchFilter} to a FIQL expression:
 *
 *   { name: { ILIKE: "%a%" }, $or: [{ group: { EQ: "b" } }, { group: { EQ: "c" } }] }
 *   => name==*a*;(group==b,group==c)
 *
 * This is the only place FIQL should be produced.
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
      return { text: `${field}!=${argument(value)}`, compound: false };
    case "LIKE":
    case "ILIKE":
      return { text: `${field}==${wildcardArgument(value)}`, compound: false };
    case "NOT_ILIKE":
      return { text: `${field}!=${wildcardArgument(value)}`, compound: false };
    case "GT":
      return { text: `${field}=gt=${String(value)}`, compound: false };
    case "GOE":
      return { text: `${field}=ge=${String(value)}`, compound: false };
    case "LT":
      return { text: `${field}=lt=${String(value)}`, compound: false };
    case "LOE":
      return { text: `${field}=le=${String(value)}`, compound: false };
    case "IN": {
      // FIQL has no "in" operator so IN becomes an OR of equalities. Values are arrays or comma lists.
      const values = Array.isArray(value) ? value : String(value).split(",");
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
  value: SimpleSearchFilterValue | SimpleSearchFilterValue[]
): string {
  if (value === null) {
    return "null";
  }
  return typeof value === "string" ? fiqlArgument(value) : String(value);
}

/**
 * LIKE and ILIKE values use "%" as the wildcard, and "\%", "\_" and "\\" for literal characters.
 * FIQL uses "*" as the wildcard, and the back-end escapes "%" and "_" itself, so literal characters
 * are sent as they are.
 */
function wildcardArgument(
  value: SimpleSearchFilterValue | SimpleSearchFilterValue[]
): string {
  if (typeof value !== "string") {
    return argument(value);
  }
  return fiqlArgument(
    value.replace(/\\([\\%_])|%/g, (_match, literal) => literal ?? "*")
  );
}

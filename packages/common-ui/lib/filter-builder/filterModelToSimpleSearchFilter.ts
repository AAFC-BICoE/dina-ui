import { KitsuResource } from "kitsu";
import moment from "moment";
import {
  OR_KEY,
  SimpleSearchFilter,
  isEmptySimpleSearchFilter,
  isPlainFilterValue,
  mergeSimpleSearchFilters
} from "../util/simpleSearchFilterBuilder";
import { FreeTextSearchFilterModel } from "../filter-free-text-search/FilterFreeTextSearchField";
import { FilterAttributeConfig } from "./FilterBuilder";
import { FilterGroupModel } from "./FilterGroup";
import { FilterRowModel, FilterRowSearchType } from "./FilterRow";
import { DateRange } from "./FilterRowDatePicker";

export type FilterModel =
  | FilterGroupModel
  | FilterRowModel
  | FreeTextSearchFilterModel;

/**
 * Converts the filter builder UI model to a {@link SimpleSearchFilter} to combine
 * it with other filters via SimpleSearchFilterBuilder and send it to the back-end.
 *
 * Returns an empty filter for a blank model.
 */
export function filterModelToSimpleSearchFilter(
  model: FilterModel | null | undefined
): SimpleSearchFilter {
  if (!model) {
    return {};
  }
  switch (model.type) {
    case "FILTER_GROUP":
      return groupToFilter(model);
    case "FILTER_ROW":
      return rowToFilter(model);
    case "FREE_TEXT_SEARCH_FILTER":
      return freeTextSearchToFilter(model);
  }
}

/** Combines filters with AND or OR and drops empty ones. */
function combine(
  operator: "AND" | "OR",
  filters: SimpleSearchFilter[]
): SimpleSearchFilter {
  const members = filters.filter(
    (filter) => !isEmptySimpleSearchFilter(filter)
  );
  if (members.length === 0) {
    return {};
  }
  if (operator === "AND") {
    return members.reduce(mergeSimpleSearchFilters, {});
  }
  return members.length === 1 ? members[0] : { [OR_KEY]: members };
}

function groupToFilter(group: FilterGroupModel): SimpleSearchFilter {
  const children = group.children
    // Exclude PARTIAL_MATCH or EXACT_MATCH rows with no value.
    .filter(
      (child) =>
        !(
          child.type === "FILTER_ROW" &&
          (child.searchType === "PARTIAL_MATCH" ||
            child.searchType === "EXACT_MATCH") &&
          !child.value
        )
    )
    .map((child) =>
      child.type === "FILTER_GROUP" ? groupToFilter(child) : rowToFilter(child)
    );

  return combine(group.operator, children);
}

function rowToFilter(row: FilterRowModel): SimpleSearchFilter {
  const { attribute, predicate, searchType, value } = row;

  const attributeConfig: FilterAttributeConfig =
    typeof attribute === "string"
      ? { name: attribute, type: "STRING" }
      : attribute;
  const selector = attributeConfig.name;

  // Ignore BLANK_FIELD if carried over onto a DATE attribute.
  if (searchType === "BLANK_FIELD" && attributeConfig.type !== "DATE") {
    // Use LIKE "%" for non-blank text fields since back-end "NEQ null" matches nothing.
    if (predicate === "IS NOT" && isTextAttribute(attributeConfig)) {
      return { [selector]: { LIKE: "%" } };
    }
    return { [selector]: { [predicate === "IS" ? "EQ" : "NEQ"]: null } };
  }

  if (predicate === "IN" || predicate === "NOT IN") {
    const values = (Array.isArray(value) ? value : [value]).map((val) =>
      valueToString(attributeConfig, val)
    );
    if (predicate === "IN") {
      return { [selector]: { IN: values.join(",") } };
    }
    // NOT IN requires no matching values.
    return combine(
      "AND",
      values.map((val) => ({ [selector]: { NEQ: val } }))
    );
  }

  // Allow list or range filters like "1-5,10-20,42".
  if (typeof value === "string" && attributeConfig.allowRange) {
    const positive = predicate !== "IS NOT";
    const members = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        if (item.includes("-")) {
          const [low, high] = item
            .split("-")
            .sort((a, b) => Number(a) - Number(b));
          return betweenFilter({ low, high, positive, selector });
        }
        // Non-range list items match according to the row's configuration to
        // prevent partial matches from becoming exact matches.
        return matchFilter(selector, searchType, positive, item);
      });
    return combine(positive ? "OR" : "AND", members);
  }

  if (attributeConfig.type === "DATE") {
    const dates =
      predicate === "BETWEEN"
        ? [(value as DateRange).low, (value as DateRange).high]
        : [value as string, value as string];
    // Sort dates in case they are given out of order.
    const [low, high] = dates.sort((a, b) => Date.parse(a) - Date.parse(b));

    // Send dates in UTC ("Z") because the back-end parser strips "+" from "+hh:mm" offsets.
    const beginningOfRange = new Date(low);
    beginningOfRange.setHours(0, 0, 0, 0); // Beginning of the day.
    const beginningOfRangeString = moment(beginningOfRange).toISOString();

    const endOfRange = new Date(high);
    endOfRange.setHours(23, 59, 59, 999); // End of the day.
    const endOfRangeString = moment(endOfRange).toISOString();

    switch (predicate) {
      case "FROM":
        // GreaterThan searches match from the start of the chosen day.
        return { [selector]: { GOE: beginningOfRangeString } };
      case "UNTIL":
        // LessThan searches match until the end of the chosen day.
        return { [selector]: { LOE: endOfRangeString } };
      default:
        return betweenFilter({
          low: beginningOfRangeString,
          high: endOfRangeString,
          positive: predicate !== "IS NOT",
          selector
        });
    }
  }

  return matchFilter(
    selector,
    searchType,
    predicate !== "IS NOT",
    valueToString(attributeConfig, value)
  );
}

/** Returns true for non-range string attributes. */
function isTextAttribute(attributeConfig: FilterAttributeConfig): boolean {
  return (
    (attributeConfig.type ?? "STRING") === "STRING" &&
    !attributeConfig.allowRange
  );
}

/**
 * Returns true if all non-wildcard characters in `value` are non-plain characters
 * (which would otherwise turn into all-wildcard patterns matching every record).
 */
function isUnsearchable(value: string): boolean {
  const characters = Array.from(value.replace(/[%_*]/g, ""));
  return (
    characters.length > 0 &&
    characters.every((character) => !isPlainFilterValue(character))
  );
}

/** A single exact, partial, positive or negated value match condition. */
function matchFilter(
  selector: string,
  searchType: FilterRowSearchType,
  positive: boolean,
  value: string | null
): SimpleSearchFilter {
  // Fall back to EQ when a positive pattern has only non-plain characters (see isUnsearchable)
  if (
    positive &&
    value !== null &&
    (searchType === "PARTIAL_MATCH" || value.includes("*")) &&
    isUnsearchable(value)
  ) {
    return { [selector]: { EQ: value } };
  }
  if (searchType === "PARTIAL_MATCH") {
    return {
      [selector]: { [positive ? "ILIKE" : "NOT_ILIKE"]: `%${value}%` }
    };
  }
  // Treat "*" in an exact match as a wildcard (LIKE for positive, NEQ for negated FIQL)
  if (value?.includes("*")) {
    return { [selector]: positive ? { LIKE: value } : { NEQ: value } };
  }
  return { [selector]: { [positive ? "EQ" : "NEQ"]: value } };
}

function freeTextSearchToFilter(
  model: FreeTextSearchFilterModel
): SimpleSearchFilter {
  const { filterAttributes, value } = model;
  if (!value) {
    return {};
  }
  return combine(
    "OR",
    filterAttributes.map((attribute) => {
      const selector =
        typeof attribute === "string" ? attribute : attribute.name;
      // Fall back to EQ when value has only non-plain characters
      return isUnsearchable(value)
        ? { [selector]: { EQ: value } }
        : { [selector]: { ILIKE: `%${value}%` } };
    })
  );
}

/** Search on IDs for dropdown resource values. */
function valueToString(
  attributeConfig: FilterAttributeConfig,
  value: any
): string | null {
  if (attributeConfig.type === "DROPDOWN" && typeof value === "object") {
    const id = (value as KitsuResource)?.id;
    return id === null || id === undefined ? null : String(id);
  }
  return value === null || value === undefined ? null : String(value);
}

interface BetweenFilterParams {
  selector: string;
  low: string;
  high: string;
  positive: boolean;
}

/** Creates a "between" filter or its negation using low and high values. */
function betweenFilter({
  low,
  high,
  positive,
  selector
}: BetweenFilterParams): SimpleSearchFilter {
  return positive
    ? { [selector]: { GOE: low, LOE: high } }
    : { [OR_KEY]: [{ [selector]: { LT: low } }, { [selector]: { GT: high } }] };
}

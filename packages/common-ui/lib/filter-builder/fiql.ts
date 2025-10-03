import { FilterParam, KitsuResource } from "kitsu";
import moment from "moment";
import { FilterAttributeConfig } from "./FilterBuilder";
import { FilterGroupModel } from "./FilterGroup";
import { FilterRowModel } from "./FilterRow";
import { DateRange } from "./FilterRowDatePicker";
import { FreeTextSearchFilterModel } from "../filter-free-text-search/FilterFreeTextSearchField";

interface FiqlOperand {
  arguments: string | string[];
  comparison: string;
  selector: string;
}

interface FiqlOperandGroup {
  operands: (FiqlOperand | FiqlOperandGroup)[];
  operator: string;
}

export function simpleSearchFilterToFiql(
  filter: FilterParam | undefined
): string {
  const fiqlClauses: string[] = [];

  // Loop over each field in the filter object (e.g., 'name', 'description', 'age').
  for (const [fieldName, operators] of Object.entries(filter || {})) {
    if (!operators) continue;

    for (const [operator, value] of Object.entries(operators)) {
      const fiqlOperator =
        operator.toUpperCase() === "EQ" || operator.toUpperCase() === "ILIKE"
          ? "" // Empty string since the operator is implicit in FIQL for equality
          : operator.toLowerCase();

      let fiqlValue = value === null ? "null" : value;

      // Replace "%" with "*" for ILIKE operations (FIQL partial matching)
      if (operator.toUpperCase() === "ILIKE" && typeof fiqlValue === "string") {
        fiqlValue = fiqlValue.replace(/%/g, "*");
      }

      fiqlClauses.push(`${fieldName}=${fiqlOperator}=${fiqlValue}`);
    }
  }

  return fiqlClauses.join(";");
}

/** Converts a FilterGroupModel to a FIQL expression. */
export function fiql(
  filter: FilterGroupModel | FilterRowModel | FreeTextSearchFilterModel | null
): string {
  if (!filter) {
    return "";
  }
  switch (filter.type) {
    case "FILTER_GROUP":
      return transformToFIQL(toGroup(filter));
    case "FILTER_ROW":
      return transformToFIQL(toPredicate(filter));
    case "FREE_TEXT_SEARCH_FILTER": {
      return transformToFIQL(toFreeTextSearch(filter));
    }
  }
}

/** Converts FIQL operand structure to FIQL string format */
function transformToFIQL(operand: FiqlOperand | FiqlOperandGroup): string {
  if ("selector" in operand) {
    // Single operand
    const args = Array.isArray(operand.arguments)
      ? operand.arguments.join(",")
      : operand.arguments;
    return `${operand.selector}${operand.comparison}${args}`;
  } else {
    // Group of operands
    const operandStrings = operand.operands.map((op) => {
      const transformed = transformToFIQL(op);
      // Only wrap in parentheses if it contains operators and we're not at the root level
      if (
        (transformed.includes(";") || transformed.includes(",")) &&
        operand.operands.length > 1
      ) {
        return `(${transformed})`;
      }
      return transformed;
    });

    const separator = operand.operator === "AND" ? ";" : ",";
    return operandStrings.join(separator);
  }
}

/** Converts a FilterGroupModel to a FIQL expression. */
function toGroup(
  filterGroup: FilterGroupModel
): FiqlOperandGroup | FiqlOperand {
  const { children, operator } = filterGroup;

  return {
    operands: children
      // Exclude filter rows using PARTIAL_MATCH or EXACT_MATCH with no value.
      .filter(
        (child) =>
          !(
            child.type === "FILTER_ROW" &&
            (child.searchType === "PARTIAL_MATCH" ||
              child.searchType === "EXACT_MATCH") &&
            !child.value
          )
      )
      // Exclude filter groups with no children:
      .filter(
        (child) => !(child.type === "FILTER_GROUP" && !child.children.length)
      )
      .map((child) => {
        switch (child.type) {
          case "FILTER_GROUP":
            return toGroup(child);
          case "FILTER_ROW":
            return toPredicate(child);
        }
      }),
    operator
  };
}

/** Converts a FilterRowModel to a FIQL expression. */
function toPredicate(
  filterRow: FilterRowModel
): FiqlOperandGroup | FiqlOperand {
  const { attribute, predicate, searchType, value } = filterRow;

  const attributeConfig: FilterAttributeConfig =
    typeof attribute === "string"
      ? { name: attribute, type: "STRING" }
      : attribute;

  const selector = typeof attribute === "string" ? attribute : attribute.name;

  if (searchType === "BLANK_FIELD") {
    const comparison = predicate === "IS" ? "==" : "!=";
    const operator = predicate === "IS" ? "OR" : "AND";

    // The rsql version checks for both null and empty string, but FIQL does not support empty string checks.
    return {
      operands: [
        {
          arguments: "null",
          comparison,
          selector
        }
      ],
      operator
    };
  }

  // Allow list/range filters.
  if (typeof value === "string" && attributeConfig?.allowRange) {
    const commaSplit = value.split(",");
    const ranges = attributeConfig?.allowRange
      ? commaSplit.filter((e) => e.includes("-"))
      : commaSplit;

    const rangeOperands = attributeConfig.allowRange
      ? ranges.map((range) => {
          const [low, high] = range
            .split("-")
            .sort((a, b) => Number(a) - Number(b));

          const positive = predicate === "IS";

          return betweenOperand({ low, high, positive, selector });
        })
      : [];

    return {
      operands: [...rangeOperands],
      operator: predicate === "IS NOT" ? "AND" : "OR"
    };
  }

  let searchValue;
  let compare;

  // Handle date searches:
  if (attributeConfig.type === "DATE") {
    const dates =
      predicate === "BETWEEN"
        ? [(value as DateRange).low, (value as DateRange).high]
        : [value as string, value as string];
    // Sort the dates in case the user gives them in the wrong order:
    const [low, high] = dates.sort((a, b) => Date.parse(a) - Date.parse(b));

    const beginningOfRange = new Date(low);
    beginningOfRange.setHours(0, 0, 0, 0); // Beginning of the day.
    const beginningOfRangeString = moment(beginningOfRange).format();

    const endOfRange = new Date(high);
    endOfRange.setHours(23, 59, 59, 999); // End of the day.
    const endOfRangeString = moment(endOfRange).format();

    if (predicate === "FROM") {
      compare = "=ge=";
      // GreaterThan searches should match from the beginning of the chosen day:
      searchValue = beginningOfRangeString;
    } else if (predicate === "UNTIL") {
      compare = "=le=";
      // LessThan searches should match from the end of the chosen day:
      searchValue = endOfRangeString;
    } else if (
      predicate === "IS" ||
      predicate === "IS NOT" ||
      predicate === "BETWEEN"
    ) {
      return betweenOperand({
        low: beginningOfRangeString,
        high: endOfRangeString,
        positive: predicate !== "IS NOT",
        selector
      });
    }
  }

  if (
    attributeConfig.type === "DROPDOWN" ||
    attributeConfig.type === "STRING"
  ) {
    searchValue =
      attributeConfig.type === "DROPDOWN"
        ? String((value as KitsuResource).id)
        : (value as string);

    if (searchType === "PARTIAL_MATCH") {
      searchValue = `*${searchValue}*`;
      compare = predicate === "IS NOT" ? "!=" : "==";
    } else if (searchType === "EXACT_MATCH") {
      compare = predicate === "IS NOT" ? "!=" : "==";
    }
  }

  return {
    arguments: searchValue,
    comparison: compare,
    selector
  };
}

function toFreeTextSearch(
  filterRow: FreeTextSearchFilterModel
): FiqlOperandGroup {
  const { filterAttributes, value } = filterRow;

  const operands = filterAttributes.map((attribute) => {
    const selector = typeof attribute === "string" ? attribute : attribute.name;
    const operand: FiqlOperand = {
      arguments: `*${value}*`,
      comparison: "==",
      selector
    };
    return operand;
  });
  return {
    operands,
    operator: "OR"
  };
}

interface BetweenOperandParams {
  selector: string;
  low: string | string[];
  high: string | string[];
  positive: boolean;
}

/** Creates a "between"-type operand given low and high values. */
function betweenOperand({
  low,
  high,
  positive,
  selector
}: BetweenOperandParams): FiqlOperandGroup {
  return {
    operands: [
      {
        arguments: low,
        comparison: positive ? "=ge=" : "=lt=",
        selector
      },
      {
        arguments: high,
        comparison: positive ? "=le=" : "=gt=",
        selector
      }
    ],
    operator: positive ? "AND" : "OR"
  };
}

import { KitsuResource } from "kitsu";
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
      if (transformed.includes(";") || transformed.includes(",")) {
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

    // A blank field could be either a null value or an empty string.
    return {
      operands: [
        {
          arguments: "null",
          comparison,
          selector
        },
        {
          arguments: "",
          comparison,
          selector
        }
      ],
      operator
    };
  }

  // Allow list/range filters.
  if (
    typeof value === "string" &&
    (attributeConfig?.allowList || attributeConfig?.allowRange)
  ) {
    const commaSplit = value.split(",");

    const singleNumbers = attributeConfig?.allowRange
      ? commaSplit.filter((e) => !e.includes("-"))
      : commaSplit;
    const ranges = attributeConfig?.allowRange
      ? commaSplit.filter((e) => e.includes("-"))
      : commaSplit;

    const listOperands = attributeConfig.allowList
      ? singleNumbers.length
        ? [
            {
              arguments: singleNumbers,
              comparison: predicate === "IS NOT" ? "!==" : "==", // FIQL uses different operators
              selector
            }
          ]
        : []
      : [];

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
      operands: [...listOperands, ...rangeOperands],
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

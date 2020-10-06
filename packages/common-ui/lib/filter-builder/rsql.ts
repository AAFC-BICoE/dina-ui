import { transformToRSQL } from "@molgenis/rsql";
import moment from "moment";
import { FilterAttributeConfig } from "./FilterBuilder";
import { FilterGroupModel } from "./FilterGroup";
import { FilterRowModel } from "./FilterRow";

interface RsqlOperand {
  arguments: string | string[];
  comparison: string;
  selector: string;
}

interface RsqlOperandGroup {
  operands: (RsqlOperand | RsqlOperandGroup)[];
  operator: string;
}

/** Converts a FilterGroupModel to an RSQL expression. */
export function rsql(filter: FilterGroupModel | null): string {
  if (!filter) {
    return "";
  }
  return transformToRSQL(toGroup(filter));
}

/** Converts a FilterGroupModel to an RSQL expression. */
function toGroup(filterGroup: FilterGroupModel): RsqlOperandGroup {
  const { children, operator } = filterGroup;

  return {
    operands: children
      // Exclude filter rows using PARTIAL_MATCH or EXACT_MATCH with no value.
      .filter(
        child =>
          !(
            child.type === "FILTER_ROW" &&
            (child.searchType === "PARTIAL_MATCH" ||
              child.searchType === "EXACT_MATCH") &&
            !child.value
          )
      )
      .map(child => {
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

/** Converts a FilterRowModel to an RSQL expression. */
function toPredicate(
  filterRow: FilterRowModel
): RsqlOperandGroup | RsqlOperand {
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
  if (typeof value === "string" && attributeConfig.allowRange) {
    const commaSplit = value.split(",");

    const singleNumbers = commaSplit.filter(e => !e.includes("-"));
    const ranges = commaSplit.filter(e => e.includes("-"));

    const listOperands = singleNumbers.length
      ? [
          {
            arguments: singleNumbers,
            comparison: predicate === "IS NOT" ? "=out=" : "=in=",
            selector
          }
        ]
      : [];

    const rangeOperands = ranges.map(range => {
      const [low, high] = range
        .split("-")
        .sort((a, b) => Number(a) - Number(b));

      const positive = predicate === "IS";

      return betweenOperand({ low, high, positive, selector });
    });

    return {
      operands: [...listOperands, ...rangeOperands],
      operator: predicate === "IS NOT" ? "AND" : "OR"
    };
  }

  // Surround the search value with asterisks if this is a partial match for string property type search
  let searchValue: string = typeof value === "string" ? value : value.id ?? "";
  let compare;
  if (
    attributeConfig.type === "DROPDOWN" ||
    attributeConfig.type === "STRING"
  ) {
    if (searchType === "PARTIAL_MATCH") {
      searchValue = `*${searchValue}*`;
      compare = predicate === "IS NOT" ? "!=" : "==";
    } else if (searchType === "EXACT_MATCH") {
      compare = predicate === "IS NOT" ? "!=" : "==";
    }
  }

  // Handle date searches:
  if (attributeConfig.type === "DATE") {
    const beginningOfDay = new Date(searchValue);
    beginningOfDay.setHours(0, 0, 0, 0);
    const beginningOfDayString = moment(beginningOfDay).format();

    const endOfDay = new Date(searchValue);
    endOfDay.setHours(23, 59, 59, 999);
    const endOfDayString = moment(endOfDay).format();

    if (predicate === "FROM") {
      compare = "=ge=";
      // GreaterThan searches should match from the beginning of the chosen day:
      searchValue = beginningOfDayString;
    } else if (predicate === "UNTIL") {
      compare = "=le=";
      // LessThan searches should match from the end of the chosen day:
      searchValue = endOfDayString;
    } else if (predicate === "IS" || predicate === "IS NOT") {
      return betweenOperand({
        low: beginningOfDayString,
        high: endOfDayString,
        positive: predicate === "IS",
        selector
      });
    }
  }

  return {
    arguments: searchValue,
    comparison: compare,
    selector
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
}: BetweenOperandParams): RsqlOperandGroup {
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

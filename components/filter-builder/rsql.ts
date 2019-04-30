import { transformToRSQL } from "@molgenis/rsql";
import { FilterGroupModel } from "./FilterGroup";
import { FilterRowModel } from "./FilterRow";

/** Converts a FilterGroupModel to an RSQL expression. */
export function rsql(filter?: FilterGroupModel): string {
  if (!filter) {
    return "";
  }
  return transformToRSQL(toGroup(filter));
}

/** Converts a FilterGroupModel to an RSQL expression. */
function toGroup(filterGroup: FilterGroupModel) {
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
function toPredicate(filterRow: FilterRowModel) {
  const { attribute, predicate, searchType, value } = filterRow;

  if (searchType === "BLANK_FIELD") {
    const comparison = predicate === "IS" ? "==" : "!=";
    const operator = predicate === "IS" ? "OR" : "AND";

    // A blank field could be either a null value or an empty string.
    return {
      operands: [
        {
          arguments: "null",
          comparison,
          selector: attribute
        },
        {
          arguments: "",
          comparison,
          selector: attribute
        }
      ],
      operator
    };
  }

  // Surround the search value with asterisks if this is a partial match.
  const searchValue = searchType === "PARTIAL_MATCH" ? `*${value}*` : value;

  return {
    arguments: searchValue,
    comparison: predicate === "IS NOT" ? "!=" : "==",
    selector: attribute
  };
}

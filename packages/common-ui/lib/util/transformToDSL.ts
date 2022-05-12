import { QueryRowExportProps } from "../query-builder/QueryRow";
import Bodybuilder from "bodybuilder";
import { LimitOffsetPageSpec, TableColumn } from "..";
import { SortingRule } from "react-table";
import { KitsuResource } from "kitsu";

export interface TransformQueryToDSLParams {
  queryRows: QueryRowExportProps[];
  group: string;
}

export function transformQueryToDSL<TData extends KitsuResource>(
  pagination: LimitOffsetPageSpec,
  columns: TableColumn<TData>[],
  sortingRules: SortingRule[],
  submittedValues: TransformQueryToDSLParams
) {
  const builder = Bodybuilder();

  if (!submittedValues) {
    return;
  }

  /**
   * Formik will store the values in different spots depending on the queryRow type.
   *
   * This helper function will retrieve the value based on the type.
   *
   * @param queryRow
   * @returns value based on the query row type.
   */
  function getValueBasedOnType(queryRow) {
    switch (queryRow.type) {
      // Boolean type
      case "boolean":
        return queryRow.boolean;

      // Number types
      case "long":
      case "short":
      case "integer":
      case "byte":
      case "double":
      case "float":
      case "scaled_float":
      case "unsigned_long":
        return queryRow.number;

      // Date type
      case "date":
        return queryRow.date;

      // Text types
      case "text":
      case "keyword":
        return queryRow.matchValue ?? "";

      default:
        return null;
    }
  }

  function getMatchType(queryRow) {
    switch (queryRow.type) {
      // Text based input can also have exact or partial matches.
      case "text":
      case "keyword":
        return queryRow.matchType as string;

      default:
        return "term";
    }
  }

  function getFieldName(queryRow) {
    if (queryRow.matchType === "term" || queryRow?.distinctTerm)
      return queryRow.fieldName + ".keyword";
    return queryRow.fieldName;
  }

  /**
   * Due to the way the included section is handled, it's an array of the different types.
   * Two fields from different types could share the same path:
   *
   * included.attributes.name = Could be for preparation-type or material-sample for example.
   *
   * This method will take the unique value and convert it to the version above.
   *
   * preparation-type.name --> included.attributes.name
   *
   * The included.type will be used to perform the search on the correct type.
   */
  function getRelationshipFieldName(queryRow) {
    const newFieldName =
      queryRow.parentPath +
      "." +
      queryRow.fieldName.substring(queryRow.fieldName.indexOf(".") + 1);
    if (queryRow.matchType === "term" || queryRow?.distinctTerm)
      return newFieldName + ".keyword";
    return newFieldName;
  }

  function buildRelationshipQuery(rowToBuild) {
    // The type can change some of these fields below.
    const value = getValueBasedOnType(rowToBuild);
    const type = getMatchType(rowToBuild);
    const fieldName = getRelationshipFieldName(rowToBuild);

    // Create a nested query for each relationship type query.
    builder.query("nested", { path: "included" }, queryBuilder => {
      return queryBuilder
        .andQuery("match", "included.type", rowToBuild.parentName)
        .andQuery(
          type,
          fieldName.replace("included.", "included.attributes."),
          value
        );
    });
  }

  /**
   * Used for attributes directly involved with the index. Relationship queries should be using
   * the buildRelationshipQuery function instead.
   *
   * @param rowToBuild
   */
  function buildQuery(rowToBuild) {
    // The type can change some of these fields below.
    const value = getValueBasedOnType(rowToBuild);
    const type = getMatchType(rowToBuild);
    const fieldName = getFieldName(rowToBuild);

    // Currently only AND is supported, so this acts just like a AND.
    builder.query(type, fieldName, value);
  }

  // Remove the row that user did not select any field to search on or
  // no value is put for the selected field
  submittedValues?.queryRows
    .filter(
      queryRow =>
        queryRow.fieldName &&
        ((queryRow.type === "boolean" && queryRow.boolean) ||
          ((queryRow.type === "long" ||
            queryRow.type === "short" ||
            queryRow.type === "integer" ||
            queryRow.type === "byte" ||
            queryRow.type === "double" ||
            queryRow.type === "float" ||
            queryRow.type === "half_float" ||
            queryRow.type === "scaled_float" ||
            queryRow.type === "unsigned_long") &&
            queryRow.number) ||
          (queryRow.type === "date" && queryRow.date) ||
          ((queryRow.type === "text" || queryRow.type === "keyword") &&
            queryRow.matchType &&
            queryRow.matchValue))
    )
    .map(queryRow => {
      // Determine if the attribute is inside a relationship.
      if (queryRow.parentName) {
        buildRelationshipQuery(queryRow);
      } else {
        buildQuery(queryRow);
      }
    });

  // Add the search group filter.
  if (
    Array.isArray(submittedValues.group) &&
    submittedValues.group.length > 0
  ) {
    builder.andFilter("terms", "data.attributes.group", submittedValues.group);
  } else if (!Array.isArray(submittedValues.group) && submittedValues.group) {
    builder.andFilter("term", "data.attributes.group", submittedValues.group);
  }

  // Apply pagination rules to elastic search query.
  if (pagination) {
    builder.size(pagination.limit);
    builder.from(pagination.offset);
  }

  // Apply sorting rules to elastic search query.
  if (sortingRules && sortingRules.length > 0) {
    sortingRules.forEach(sortingRule => {
      const columnDefinition = columns.find(column => {
        // Depending on if it's a string or not.
        if (typeof column === "string") {
          return column === sortingRule.id;
        } else {
          return column.accessor === sortingRule.id;
        }
      });

      // Edge case if a string is only provided as the column definition.
      if (typeof columnDefinition === "string") {
        builder.sort(columnDefinition, sortingRule.desc ? "desc" : "asc");
      } else {
        if (!columnDefinition || !columnDefinition?.accessor) return;

        const indexPath =
          columnDefinition.accessor +
          (columnDefinition.isKeyword && columnDefinition.isKeyword === true
            ? ".keyword"
            : "");

        if (columnDefinition.relationshipType) {
          builder.sort([
            {
              [indexPath]: {
                order: sortingRule.desc ? "desc" : "asc",
                nested_path: "included",
                nested_filter: {
                  term: {
                    "included.type": columnDefinition.relationshipType
                  }
                }
              }
            }
          ]);
        } else {
          builder.sort(indexPath, sortingRule.desc ? "desc" : "asc");
        }
      }
    });
  }

  return builder.build();
}

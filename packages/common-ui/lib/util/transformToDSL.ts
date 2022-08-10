import Bodybuilder from "bodybuilder";
import { LimitOffsetPageSpec } from "..";
import { SortingRule } from "react-table";
import { KitsuResource } from "kitsu";
import { QueryRowExportProps } from "../list-page/QueryRow";
import { TableColumn } from "../list-page/types";
import { transformBooleanSearchToDSL } from "../list-page/query-row-search-options/QueryRowBooleanSearch";
import { transformTextSearchToDSL } from "../list-page/query-row-search-options/QueryRowTextSearch";
import { transformDateSearchToDSL } from "../list-page/query-row-search-options/QueryRowDateSearch";

export interface ElasticSearchQueryParams {
  queryType: string;
  fieldName?: string;
  value?: any;
}

export interface TransformQueryToDSLParams {
  queryRows: QueryRowExportProps[];
  group: string;
}

/**
 * Retrieves the field name for elastic search to search against. Sometimes a field name requires
 * the .keyword property.
 *
 * @param queryRow The query row options the user has selected.
 * @returns the field name, with or without the .keyword property.
 */
export function getFieldName(queryRow) {
  if (queryRow.type === "keyword" || queryRow?.distinctTerm)
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
export function getRelationshipFieldName(queryRow) {
  const newFieldName =
    queryRow.parentPath +
    "." +
    queryRow.fieldName.substring(queryRow.fieldName.indexOf(".") + 1);
  if (queryRow.matchType === "keyword" || queryRow?.distinctTerm)
    return newFieldName + ".keyword";
  return newFieldName;
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

  function buildInnerQueryBasedOnType(queryRow): ElasticSearchQueryParams {
    switch (queryRow.type) {
      // Boolean type
      case "boolean":
        return transformBooleanSearchToDSL(queryRow);

      // Number types
      case "long":
      case "short":
      case "integer":
      case "byte":
      case "double":
      case "float":
      case "scaled_float":
      case "unsigned_long":

      // Date type
      case "date":
        return transformDateSearchToDSL(queryRow);

      // Text types
      case "text":
      case "keyword":
        return transformTextSearchToDSL(queryRow);

      // Default just treat it like a text search.
      default:
        return transformTextSearchToDSL(queryRow);
    }
  }

  /**
   * Used for generated the included section of the query. If using a field directly on the index,
   * the buildQuery() function should be used instead.
   *
   * @param rowToBuild The query row to build the query for.
   */
  function buildRelationshipQuery(rowToBuild) {
    const queryParams = buildInnerQueryBasedOnType(rowToBuild);

    // Create a nested query for each relationship type query.
    builder.query("nested", { path: "included" }, queryBuilder => {
      return queryBuilder
        .andQuery("match", "included.type", rowToBuild.parentType)
        .andQuery(
          queryParams.queryType,
          queryParams.fieldName ?? getRelationshipFieldName(rowToBuild),
          queryParams.value
        );
    });
  }

  /**
   * Used for attributes directly involved with the index. Relationship queries should be using
   * the buildRelationshipQuery function instead.
   *
   * @param rowToBuild The query row to build the query for.
   */
  function buildQuery(rowToBuild) {
    const queryParams = buildInnerQueryBasedOnType(rowToBuild);
    builder.query(
      queryParams.queryType,
      queryParams.fieldName ?? getFieldName(rowToBuild),
      queryParams.value
    );
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
      if (queryRow.parentType) {
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

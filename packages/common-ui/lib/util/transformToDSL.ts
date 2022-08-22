import Bodybuilder from "bodybuilder";
import { LimitOffsetPageSpec } from "..";
import { SortingRule } from "react-table";
import { KitsuResource } from "kitsu";
import { QueryRowExportProps } from "../list-page/QueryRow";
import { TableColumn } from "../list-page/types";
import { uniq, groupBy } from "lodash";
import { transformBooleanSearchToDSL } from "../list-page/query-row-search-options/QueryRowBooleanSearch";
import { transformTextSearchToDSL } from "../list-page/query-row-search-options/QueryRowTextSearch";
import { transformDateSearchToDSL } from "../list-page/query-row-search-options/QueryRowDateSearch";
import { transformNumberSearchToDSL } from "../list-page/query-row-search-options/QueryRowNumberSearch";

export interface ElasticSearchQueryParams {
  queryOperator: "must" | "should" | "must_not" | "filter";
  queryType: "match" | "term" | "range" | "exists" | "wildcard" | "regexp";
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
  if (queryRow.textMatchType === "exact" || queryRow?.distinctTerm)
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
    ".attributes." +
    queryRow.fieldName.substring(queryRow.fieldName.indexOf(".") + 1);
  if (queryRow.textMatchType === "exact" || queryRow?.distinctTerm)
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

  /**
   * Depending on the data type of the field selected, the query will be transformed to elastic
   * search DSL. This is done by calling the appropriate function which can be found on each
   * QuerySearch component.
   *
   * For example, the QueryRowBooleanSearch component will transform the query to elastic search DSL
   * for boolean types.
   *
   * @param queryRow The query row options the user has selected.
   * @returns
   */
  function buildInnerQueryBasedOnType(queryRow): ElasticSearchQueryParams[] {
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
        return transformNumberSearchToDSL(queryRow);

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
   * There are certain cases where the query should not be performed. For example, if you are
   * searching on a text type, but the user has not entered any text, then the query should not be
   * performed.
   *
   * The empty search should be used in these cases. In those cases the query should be performed
   * even if the value is empty.
   *
   * @param queryRow The query row options the user has selected.
   * @returns true if the query should be added to the query DSL. False if it should be ignored.
   */
  function shouldQueryRowBeIncluded(queryRow): boolean {
    // If no field name is selected, it should be ignored.
    if (!queryRow.fieldName) {
      return false;
    }

    // If the match type is empty or not empty, then the search query should be included always.
    if (queryRow.matchType === "empty" || queryRow.matchType === "notEmpty") {
      return true;
    }

    // If the field is a number type, do not perform the search if the number value is empty.
    if (
      (queryRow.type === "long" ||
        queryRow.type === "short" ||
        queryRow.type === "integer" ||
        queryRow.type === "byte" ||
        queryRow.type === "double" ||
        queryRow.type === "float" ||
        queryRow.type === "half_float" ||
        queryRow.type === "scaled_float" ||
        queryRow.type === "unsigned_long") &&
      !queryRow.number
    ) {
      return false;
    }

    // If the field is a date type, do not perform the search if the date value is empty.
    if (queryRow.type === "date" && !queryRow.date) {
      return false;
    }

    // If the field is a text type, do not perform the search if the text value is empty.
    if (
      (queryRow.type === "text" || queryRow.type === "keyword") &&
      !queryRow.matchValue
    ) {
      return false;
    }

    return true;
  }

  /**
   * Used for generated the included section of the query. If using a field directly on the index,
   * the buildQuery() function should be used instead.
   *
   * @param rowToBuild The query row to build the query for.
   */
  function buildRelationshipQuery(rowToBuild) {
    const mustQueries: any[] = [];
    const mustNotQueries: any[] = [];
    const shouldQueries: any[] = [];

    const queryParams: ElasticSearchQueryParams[] =
      buildInnerQueryBasedOnType(rowToBuild);

    // The included type must match the parent type of the row.
    mustQueries.push({
      match: {
        "included.type": rowToBuild.parentType
      }
    });

    queryParams.forEach(queryParam => {
      const query = {
        [queryParam.queryType]:
          queryParam.queryType !== "exists"
            ? {
                [queryParam.fieldName ?? getRelationshipFieldName(rowToBuild)]:
                  queryParam.value
              }
            : {
                field:
                  queryParam.fieldName ?? getRelationshipFieldName(rowToBuild)
              }
      };

      switch (queryParam.queryOperator) {
        case "must":
          mustQueries.push(query);
          break;
        case "must_not":
          mustNotQueries.push(query);
          break;
        case "should":
          shouldQueries.push(query);
          break;
      }
    });

    return {
      nested: {
        path: "included",
        query: {
          bool: {
            // Must Queries
            ...(mustQueries.length !== 0 && {
              must: mustQueries.length === 1 ? mustQueries[0] : mustQueries
            }),

            // Must_Not Queries
            ...(mustNotQueries.length !== 0 && {
              must_not:
                mustNotQueries.length === 1 ? mustNotQueries[0] : mustNotQueries
            }),

            // Should Queries
            ...(shouldQueries.length !== 0 && {
              should:
                shouldQueries.length === 1 ? shouldQueries[0] : shouldQueries
            })
          }
        }
      }
    };
  }

  /**
   * Used for attributes directly involved with the index. Relationship queries should be using
   * the buildRelationshipQuery function instead.
   *
   * @param rowToBuild The query row to build the query for.
   */
  function buildQuery(rowToBuild) {
    const mustQueries: any[] = [];
    const mustNotQueries: any[] = [];
    const shouldQueries: any[] = [];

    const queryParams: ElasticSearchQueryParams[] =
      buildInnerQueryBasedOnType(rowToBuild);

    queryParams.forEach(queryParam => {
      const query = {
        [queryParam.queryType]:
          queryParam.queryType !== "exists"
            ? {
                [queryParam.fieldName ?? getFieldName(rowToBuild)]:
                  queryParam.value
              }
            : {
                field: queryParam.fieldName ?? getFieldName(rowToBuild)
              }
      };

      switch (queryParam.queryOperator) {
        case "must":
          mustQueries.push(query);
          break;
        case "must_not":
          mustNotQueries.push(query);
          break;
        case "should":
          shouldQueries.push(query);
          break;
      }
    });

    return {
      bool: {
        // Must Queries
        ...(mustQueries.length !== 0 && {
          must: mustQueries.length === 1 ? mustQueries[0] : mustQueries
        }),

        // Must_Not Queries
        ...(mustNotQueries.length !== 0 && {
          must_not:
            mustNotQueries.length === 1 ? mustNotQueries[0] : mustNotQueries
        }),

        // Should Queries
        ...(shouldQueries.length !== 0 && {
          should: shouldQueries.length === 1 ? shouldQueries[0] : shouldQueries
        })
      }
    };
  }

  // Remove the row that user did not select any field to search on or
  // no value is put for the selected field
  const queryRowQueries = submittedValues?.queryRows
    .filter(queryRow => shouldQueryRowBeIncluded(queryRow))
    .map(queryRow => {
      if (queryRow.parentType) {
        return buildRelationshipQuery(queryRow);
      } else {
        return buildQuery(queryRow);
      }
    })
    .flat();

  // Add the search group filter.
  const multipleGroups: boolean =
    Array.isArray(submittedValues.group) && submittedValues.group.length > 0;
  if (submittedValues.group) {
    queryRowQueries.push({
      bool: {
        must: {
          [multipleGroups ? "terms" : "term"]: {
            "data.attributes.group": submittedValues.group
          }
        }
      }
    });
  }

  // Root query, only supplied if a query rows are provided (including the group)
  if (queryRowQueries.length > 0) {
    builder.rawOption("query", {
      bool: {
        must: [...queryRowQueries]
      }
    });
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

  // Display only the fields provided in the columns array.

  const sourceFilteringColumns: string[] = [
    "data.id",
    "data.type",
    ...columns
      .map(column => {
        const accessors: string[] = [];

        if (column?.accessor) {
          accessors.push(column.accessor as string);
        }

        if (column?.additionalAccessors) {
          accessors.push(...(column.additionalAccessors as string[]));
        }

        return accessors;
      })
      .flat()
  ];

  // If the source filtering contains included attributes, we need to also include the id and included type.
  if (
    sourceFilteringColumns.filter(columnValue =>
      columnValue?.startsWith("included.")
    )
  ) {
    sourceFilteringColumns.push("included.id");
    sourceFilteringColumns.push("included.type");
  }
  builder.rawOption("_source", uniq(sourceFilteringColumns));

  return builder.build();
}

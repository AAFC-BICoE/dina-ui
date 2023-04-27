import { KitsuResource } from "kitsu";
import { uniq, reject, isEmpty } from "lodash";
import { Config, ImmutableTree } from "react-awesome-query-builder";
import { SortingRule } from "react-table";
import { TableColumn } from "../../types";

export interface ElasticSearchFormatExportProps<TData extends KitsuResource> {
  /**
   * All of the columns being displayed on the table.
   *
   * This is used to generate the list of attributes to return since not all attributes will be
   * used.
   *
   * Please note some columns require additional fields which can be supplied in the
   * `TableColumn.additionalColumns`
   */
  columns: TableColumn<TData>[];

  /**
   * Provided by the QueryPage table on the sorting order that should be applied.
   */
  sortingRules: SortingRule[];
}

/**
 * This function is recursive and will go through each level to generate the query.
 *
 * This is used in the configuration for each "widget", and each query-builder-value-types has
 * a function to generate elastic search queries.
 *
 * @param queryTree ImmutableTree from the QueryBuilder to transform to elastic search.
 * @param config The Query Builder configuration.
 * @returns The root elastic search query.
 */
export function elasticSearchFormatExport(
  queryTree: ImmutableTree,
  config: Config
) {
  if (!queryTree) return undefined;
  const type = queryTree.get("type");
  const properties = queryTree.get("properties") || new Map();

  if (type === "rule" && properties.get("field")) {
    const operator = properties.get("operator");
    const field = properties.get("field");
    const value = properties.get("value").toJS();

    return buildEsRule(field, value, operator, config);
  }

  if (type === "group" || type === "rule_group") {
    let conjunction = properties.get("conjunction");
    if (!conjunction) conjunction = "AND";

    const children = queryTree.get("children1");
    return buildEsGroup(
      children,
      conjunction,
      elasticSearchFormatExport,
      config
    );
  }
}

/**
 * All of the heavy lifting for the query generation is handled by the elasticSearchFormatValue
 * which uses the transform to DSL functions. Checkout the widget configuration for each type.
 *
 * @param fieldName Query row field name
 * @param value Query row value
 * @param operator Operator being used (equals, exact match, etc...)
 * @param config The entire query builder configuration.
 * @returns Elastic Search Query for the one row on the Query Builder.
 */
function buildEsRule(
  fieldName: string,
  value: string,
  operator: string,
  config: Config
) {
  const widgetName = config.fields?.[fieldName]?.type;
  const widgetConfig = config.widgets[widgetName];
  if (!widgetConfig) return undefined; // Unable to find the widget.

  const { elasticSearchFormatValue } = widgetConfig as any;

  // Use the custom logic by default.
  let formattedValue = value?.[0] ?? "";
  if (typeof formattedValue === "string") {
    formattedValue = formattedValue.trim();
  }

  // Edge case if nothing is provided for a date.
  let operatorValue = operator;
  if (widgetName === "date" && formattedValue === "") {
    operatorValue = "empty";
  }

  const parameters = elasticSearchFormatValue(
    undefined,
    formattedValue,
    operatorValue,
    fieldName,
    config
  );

  return { ...parameters };
}

/**
 * Handle the "AND" / "OR" logic at this level. A group can contain multiple rules.
 *
 * @param children Contents of the group
 * @param conjunction "AND"/"OR" conjunctions
 * @param recursiveFunction What to use to build the contents of the group.
 * @param config Query Builder configuration.
 * @returns Elastic search group of queries.
 */
function buildEsGroup(
  children,
  conjunction,
  recursiveFunction,
  config: Config
) {
  // If there is nothing in the group, then don't add it to the query.
  if (!children || !children.size) return undefined;

  const childrenArray = children.valueSeq().toArray();

  // The conjunction determines if it's "MUST" or "SHOULD"
  const conjunctionTerm = conjunction === "AND" ? "must" : "should";

  // Go through each of the children and generate the elastic search query for each item.
  const result = childrenArray
    .map((childTree) => recursiveFunction(childTree, config))
    .filter((v) => v !== undefined);

  // If no results, do not add this group to the query.
  if (!result.length) return undefined;

  const resultFlat = result.flat(Infinity);
  const compactedResult = reject(resultFlat, isEmpty);

  return {
    bool: {
      [conjunctionTerm]: compactedResult
    }
  };
}

/**
 * Add the pagination logic to the query.
 *
 * @param elasticSearchQuery The root elastic search query to apply pagination query logic to.
 * @param pagination Pagination data from the QueryPage. This is used to tell elastic search the
 *                   offset and number of records to display per page.
 */
export function applyPagination(
  elasticSearchQuery: any,
  pageSize: number,
  pageOffset: number
) {
  // Special case if the page size is set to 0, turn off pagination on the query.
  if (pageSize === 0) {
    return elasticSearchQuery;
  }

  return {
    ...elasticSearchQuery,
    size: pageSize,
    from: pageOffset
  };
}

/**
 * Add the sorting logic to the query.
 *
 * Remember that users can select multiple columns to sort against.
 *
 * @param elasticSearchQuery The root elastic search query to apply sorting query logic to.
 * @param sortingRules All of the sorting rules from the query table.
 * @param columns The columns that are being displayed on the table.
 */
export function applySortingRules<TData extends KitsuResource>(
  elasticSearchQuery: any,
  sortingRules: SortingRule[],
  columns: TableColumn<TData>[]
) {
  if (sortingRules && sortingRules.length > 0) {
    const sortingQueries = Object.assign(
      {},
      ...sortingRules.map((sortingRule) => {
        const columnDefinition = columns.find((column) => {
          // Depending on if it's a string or not.
          if (typeof column === "string") {
            return column === sortingRule.id;
          } else {
            return column.accessor === sortingRule.id;
          }
        });

        // Edge case if a string is only provided as the column definition.
        if (typeof columnDefinition === "string") {
          return {
            [columnDefinition]: {
              order: sortingRule.desc ? "desc" : "asc"
            }
          };
        } else {
          if (!columnDefinition || !columnDefinition?.accessor) {
            return;
          }

          const indexPath =
            columnDefinition.accessor +
            (columnDefinition.isKeyword && columnDefinition.isKeyword === true
              ? ".keyword"
              : "");

          if (columnDefinition.relationshipType) {
            return {
              [indexPath]: {
                order: sortingRule.desc ? "desc" : "asc",
                nested_path: "included",
                nested_filter: {
                  term: {
                    "included.type": columnDefinition.relationshipType
                  }
                }
              }
            };
          } else {
            return {
              [indexPath]: {
                order: sortingRule.desc ? "desc" : "asc"
              }
            };
          }
        }
      })
    );

    // Add all of the queries to the existing elastic search query.
    if (sortingQueries.length !== 0) {
      return {
        ...elasticSearchQuery,
        sort: sortingQueries
      };
    }
  }

  // No sorting is being applied. Return the query back.
  return elasticSearchQuery;
}

/**
 * Without source filtering, the whole elastic search document is returned which is not required.
 *
 * This is used to specify what fields should be included in the response.
 *
 * Please note that some columns require more than one attribute in order to render the column.
 * Checkout `TableColumn.additionalAccessors`.
 *
 * @param elasticSearchQuery The root elastic search query to apply source query logic to.
 * @param columns The columns that are being displayed on the table.
 */
export function applySourceFiltering<TData extends KitsuResource>(
  elasticSearchQuery: any,
  columns: TableColumn<TData>[]
) {
  // Display only the fields provided in the columns array.
  const sourceFilteringColumns: string[] = [
    "data.id",
    "data.type",
    ...columns
      .map((column) => {
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

  // If the source filtering contains included attributes, we need to also include the id and
  // included type.
  if (
    sourceFilteringColumns.filter((columnValue) =>
      columnValue?.startsWith("included.")
    )
  ) {
    sourceFilteringColumns.push("included.id");
    sourceFilteringColumns.push("included.type");
  }

  return {
    ...elasticSearchQuery,
    _source: uniq(sourceFilteringColumns)
  };
}

/**
 * Using the existing elastic search query, the groups are added to the query.
 *
 * Multiple groups can be searched on.
 *
 * @param elasticSearchQuery The root elastic search query to apply group query logic to.
 * @param groups An array of groups to apply to the query.
 */
export function applyGroupFilters(elasticSearchQuery: any, groups: string[]) {
  // No groups to filter on.
  if (groups.length === 0) {
    return elasticSearchQuery;
  }

  const multipleGroups = groups.length > 1;

  return {
    query: {
      bool: {
        ...(elasticSearchQuery?.query?.bool ?? []),
        must: [
          ...(elasticSearchQuery?.query?.bool?.must ?? []),
          {
            [multipleGroups ? "terms" : "term"]: {
              "data.attributes.group.keyword": multipleGroups
                ? groups
                : groups[0]
            }
          }
        ]
      }
    }
  };
}

/**
 * Simply adds the query to the top level and moves the bool logic inside of it.
 *
 * This should be applied right after the bool is generated.
 *
 * @param elasticSearchQuery The root elastic search query to add to the query.
 */
export function applyRootQuery(elasticSearchQuery: any) {
  if (!elasticSearchQuery?.bool) {
    return elasticSearchQuery;
  }

  return {
    query: {
      bool: {
        ...elasticSearchQuery.bool,
        ...(elasticSearchQuery?.bool?.should ? { minimum_should_match: 1 } : {})
      }
    }
  };
}

// If it's a relationship search, ensure that the included type is being filtered out.
export function includedTypeQuery(parentType: string): any {
  return {
    term: {
      "included.type": parentType
    }
  };
}

// Query used for exact matches.
export function termQuery(
  fieldName: string,
  matchValue: any,
  keyword: boolean
): any {
  return {
    term: {
      [fieldName + (keyword ? ".keyword" : "")]: matchValue
    }
  };
}

// Query used for partial matches.
export function matchQuery(fieldName: string, matchValue: any): any {
  return {
    match: {
      [fieldName]: matchValue
    }
  };
}

// Query used to see if the field exists.
export function existsQuery(fieldName: string): any {
  return {
    exists: {
      field: fieldName
    }
  };
}

// Query used for generating ranges.
export function rangeQuery(fieldName: string, rangeOptions: any): any {
  return {
    range: {
      [fieldName]: rangeOptions
    }
  };
}

// Query used for prefix partial matches
export function prefixQuery(
  fieldName: string,
  matchValue: any,
  parentType: string | undefined
): any {
  if (matchValue === "") {
    return {};
  }

  // Lowercase the matchValue here, if it's a string.
  if (typeof matchValue === "string") {
    matchValue = matchValue.toLowerCase();
  }

  return parentType
    ? {
        nested: {
          path: "included",
          query: {
            bool: {
              must: [
                {
                  prefix: {
                    [fieldName + ".prefix"]: matchValue
                  }
                },
                includedTypeQuery(parentType)
              ]
            }
          }
        }
      }
    : {
        prefix: {
          [fieldName + ".prefix"]: matchValue
        }
      };
}

// Query used for infix partial matches.
export function infixQuery(
  fieldName: string,
  matchValue: any,
  parentType: string | undefined
): any {
  if (matchValue === "") {
    return {};
  }

  return parentType
    ? {
        nested: {
          path: "included",
          query: {
            bool: {
              must: [
                {
                  match: {
                    [fieldName + ".infix"]: {
                      query: matchValue
                    }
                  }
                },
                includedTypeQuery(parentType)
              ]
            }
          }
        }
      }
    : {
        match: {
          [fieldName + ".infix"]: {
            query: matchValue
          }
        }
      };
}

// Query used for suffix partial matches
export function suffixQuery(
  fieldName: string,
  matchValue: any,
  parentType: string | undefined
): any {
  if (matchValue === "") {
    return {};
  }

  // Reverse and lowercase the matchValue here, if it's a string.
  if (typeof matchValue === "string") {
    matchValue = matchValue.split("").reverse().join("").toLowerCase();
  }

  return parentType
    ? {
        nested: {
          path: "included",
          query: {
            bool: {
              must: [
                {
                  prefix: {
                    [fieldName + ".prefix_reverse"]: matchValue
                  }
                },
                includedTypeQuery(parentType)
              ]
            }
          }
        }
      }
    : {
        prefix: {
          [fieldName + ".prefix_reverse"]: matchValue
        }
      };
}

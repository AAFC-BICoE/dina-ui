import { ColumnSort } from "@tanstack/react-table";
import { KitsuResource } from "kitsu";
import { isEmpty, reject, uniq, compact } from "lodash";
import { Config, ImmutableTree } from "react-awesome-query-builder";
import { TableColumn } from "../../types";
import {
  SupportedBetweenTypes,
  convertStringToBetweenState
} from "../query-builder-core-components/useQueryBetweenSupport";
import {
  buildDateRangeObject,
  getTimezone
} from "../query-builder-value-types/QueryBuilderDateSearch";

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
  sortingRules: ColumnSort[];
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

  // Edge case if nothing is provided for a date (unless operator is empty/not empty)
  let operatorValue = operator;
  if (
    widgetName === "date" &&
    formattedValue === "" &&
    operator !== "empty" &&
    operator !== "notEmpty"
  ) {
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
  sortingRules: ColumnSort[],
  columns: TableColumn<TData>[]
) {
  if (sortingRules && sortingRules.length > 0) {
    const sortingQueries = compact(
      sortingRules.map((columnSort) => {
        const columnDefinition = columns.find((column) => {
          // Depending on if it's a string or not.
          if (typeof column === "string") {
            return column === columnSort.id;
          }

          // Otherwise, check if sorting is enabled for the column and matches.
          if (column.enableSorting !== false) {
            if (column.id) {
              return column.id === columnSort.id;
            } else {
              return (column as any).accessorKey.endsWith(columnSort.id);
            }
          }
          return false;
        });

        // Edge case for when strings are only provided for the column definition.
        if (typeof columnDefinition === "string") {
          return {
            [columnDefinition]: {
              order: columnSort.desc ? "desc" : "asc"
            }
          };
        }

        if (
          !columnDefinition ||
          (!(columnDefinition as any)?.accessorKey &&
            !(columnDefinition as any)?.accessorFn)
        ) {
          return;
        }

        let accessor: string | null = null;
        if (!!(columnDefinition as any)?.accessorKey) {
          accessor = (columnDefinition as any)?.accessorKey;
        } else if (!!(columnDefinition as any)?.accessorFn) {
          accessor = (columnDefinition as any)?.accessorFn();
        }

        if (!accessor) {
          return;
        }

        const indexPath =
          accessor +
          (columnDefinition.isKeyword && columnDefinition.isKeyword === true
            ? ".keyword"
            : "");

        if (columnDefinition.relationshipType) {
          return {
            [indexPath]: {
              order: columnSort.desc ? "desc" : "asc",
              nested: {
                path: "included",
                filter: {
                  term: {
                    "included.type": columnDefinition.relationshipType
                  }
                }
              }
            }
          };
        } else {
          return {
            [indexPath]: {
              order: columnSort.desc ? "desc" : "asc"
            }
          };
        }
      })
    );

    // Add all of the queries to the existing elastic search query.
    if (!isEmpty(sortingQueries)) {
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
    "data.relationships",
    ...columns
      .map((column) => {
        const accessors: string[] = [];
        let accessor: string | null = null;
        if (!!(column as any)?.accessorKey) {
          accessor = (column as any)?.accessorKey;
        } else if (!!(column as any)?.accessorFn) {
          accessor = (column as any)?.accessorFn();
        }

        if (accessor) {
          accessors.push(accessor);
        }

        if (column?.additionalAccessors) {
          accessors.push(...(column.additionalAccessors ?? []));
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
    _source: {
      includes: uniq(sourceFilteringColumns)
    }
  };
}

/**
 * This function applies source filtering to the elastic search query.
 *
 * @param elasticSearchQuery The root elastic search query to apply source query logic to.
 * @param columns String array of columns to include in the response.
 * @returns The modified elastic search query with source filtering applied.
 */
export function applySourceFilteringString(
  elasticSearchQuery: any,
  columns: string[]
) {
  const uniqueColumns = uniq(columns);

  if (uniqueColumns.length === 0) {
    return elasticSearchQuery;
  }

  return {
    ...elasticSearchQuery,
    _source: {
      includes: uniqueColumns
    }
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

/**
 * This function is responsible for taking the elastic search results can converting it to something
 * the display table can read.
 *
 * The included section will be added as an object unless it's a to-many relationship, then it's
 * transfered to an array.
 *
 * @param results Elasticsearch JSON result
 */
export function processResults(result: any) {
  return result?.hits.map((rslt) => {
    return {
      id: rslt._source?.data?.id,
      type: rslt._source?.data?.type,
      data: {
        attributes: rslt._source?.data?.attributes,
        relationships: rslt._source?.data?.relationships
      },
      included: rslt._source?.included?.reduce(
        (includedAccumulator, currentIncluded) => {
          const relationships = rslt._source?.data?.relationships ?? {};
          const currentID = currentIncluded?.id;
          const relationshipKeys = Object.keys(relationships).filter((key) => {
            const relationshipData = relationships[key].data;
            return Array.isArray(relationshipData)
              ? relationshipData.some((item) => item.id === currentID)
              : relationshipData?.id === currentID;
          });

          relationshipKeys.forEach((key) => {
            if (!includedAccumulator[key]) {
              if (Array.isArray(relationships[key].data)) {
                // if true, always use an array.
                includedAccumulator[key] = [currentIncluded];
              } else {
                // false is only use an object.
                includedAccumulator[key] = currentIncluded;
              }
            } else {
              // Found again, treat it as an array.
              if (
                typeof includedAccumulator[key] !== "object" ||
                !Array.isArray(includedAccumulator[key])
              ) {
                // Convert it to an array from an object.
                includedAccumulator[key] = [
                  includedAccumulator[key],
                  currentIncluded
                ];
              } else {
                // Already an array, push the new one into it.
                includedAccumulator[key].push(currentIncluded);
              }
            }
          });

          return includedAccumulator;
        },
        {}
      )
    };
  });
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
  keywordMultiFieldSupport: boolean
): any {
  return {
    term: {
      [fieldName + (keywordMultiFieldSupport ? ".keyword" : "")]: matchValue
    }
  };
}

// Multi-search exact matches (Non-text based) (in/not in)
export function inQuery(
  fieldName: string,
  matchValues: string,
  parentType: string | undefined,
  keywordMultiFieldSupport: boolean,
  not: boolean
): any {
  const matchValuesArray: string[] = (matchValues?.split(",") ?? [matchValues])
    .map((value) => value.trim())
    .filter((value) => value !== "");

  if (matchValuesArray.length === 0) {
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
                  bool: {
                    [not ? "must_not" : "must"]: {
                      terms: {
                        [fieldName +
                        (keywordMultiFieldSupport ? ".keyword" : "")]:
                          matchValuesArray
                      }
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
        bool: {
          [not ? "must_not" : "must"]: {
            terms: {
              [fieldName + (keywordMultiFieldSupport ? ".keyword" : "")]:
                matchValuesArray
            }
          }
        }
      };
}

// Multi-search exact matches (case-insensitive) (in/not in)
export function inTextQuery(
  fieldName: string,
  matchValues: string,
  parentType: string | undefined,
  keywordMultiFieldSupport: boolean,
  not: boolean
): any {
  const matchValuesArray: string[] = (matchValues?.split(",") ?? [matchValues])
    .map((value) => value.trim())
    .filter((value) => value !== "");

  if (matchValuesArray.length === 0) {
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
                  bool: {
                    [not ? "must_not" : "must"]: {
                      bool: {
                        should: matchValuesArray.map((value) => ({
                          term: {
                            [fieldName +
                            (keywordMultiFieldSupport ? ".keyword" : "")]: {
                              value,
                              case_insensitive: true
                            }
                          }
                        })),
                        minimum_should_match: 1
                      }
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
        bool: {
          [not ? "must_not" : "must"]: {
            bool: {
              should: matchValuesArray.map((value) => ({
                term: {
                  [fieldName + (keywordMultiFieldSupport ? ".keyword" : "")]: {
                    value,
                    case_insensitive: true
                  }
                }
              })),
              minimum_should_match: 1
            }
          }
        }
      };
}

// Multi-search exact date matches (case-insensitive) (in/not in)
export function inDateQuery(
  fieldName: string,
  matchValues: string,
  parentType: string | undefined,
  subType: string | undefined,
  not: boolean
): any {
  const matchValuesArray: string[] = (matchValues?.split(",") ?? [matchValues])
    .map((value) => value.trim())
    .filter((value) => value !== "");

  if (matchValuesArray.length === 0) {
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
                  bool: {
                    [not ? "must_not" : "must"]: [
                      {
                        bool: {
                          should: matchValuesArray.map((value) => ({
                            bool: {
                              must: [
                                rangeQuery(
                                  fieldName,
                                  buildDateRangeObject("equals", value, subType)
                                ),
                                includedTypeQuery(parentType)
                              ]
                            }
                          })),
                          minimum_should_match: 1
                        }
                      }
                    ]
                  }
                },
                includedTypeQuery(parentType)
              ]
            }
          }
        }
      }
    : {
        bool: {
          [not ? "must_not" : "must"]: {
            bool: {
              should: matchValuesArray.map((value) => {
                return rangeQuery(
                  fieldName,
                  buildDateRangeObject("equals", value, subType)
                );
              }),
              minimum_should_match: 1
            }
          }
        }
      };
}

// Query used for wildcard searches (contains).
export function wildcardQuery(
  fieldName: string,
  matchValue: any,
  keywordSupport: boolean
): any {
  return {
    wildcard: {
      [keywordSupport ? fieldName + ".keyword" : fieldName]: {
        value: `*${matchValue}*`,
        case_insensitive: true
      }
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

// Query for generating ranges to search multiple different values.
// Range is used to ignore the time so it can just search for that specific days.
export function inRangeQuery(
  fieldName: string,
  matchValues: string,
  parentType: string | undefined,
  not: boolean
): any {
  const matchValuesArray: string[] = (
    matchValues?.split(",") ?? [matchValues]
  ).map((value) => value.trim());

  return parentType
    ? {
        nested: {
          path: "included",
          query: {
            bool: {
              must: [
                {
                  bool: {
                    [not ? "should_not" : "should"]: matchValuesArray.map(
                      (date) => ({
                        range: {
                          [fieldName]: {
                            gte: date,
                            lte: date
                          }
                        }
                      })
                    )
                  }
                },
                includedTypeQuery(parentType)
              ]
            }
          }
        }
      }
    : {
        bool: {
          [not ? "should_not" : "should"]: matchValuesArray.map((date) => ({
            range: {
              [fieldName]: {
                gte: date,
                lte: date
              }
            }
          }))
        }
      };
}

// Query used for prefix partial matches
export function prefixQuery(
  fieldName: string,
  matchValue: any,
  parentType: string | undefined,
  optimizedPrefix: boolean,
  keywordSupport: boolean
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
                  prefix: {
                    [optimizedPrefix
                      ? fieldName + ".prefix"
                      : keywordSupport
                      ? fieldName + ".keyword"
                      : fieldName]: {
                      value: matchValue,
                      case_insensitive: true
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
        prefix: {
          [optimizedPrefix
            ? fieldName + ".prefix"
            : keywordSupport
            ? fieldName + ".keyword"
            : fieldName]: {
            value: matchValue,
            case_insensitive: true
          }
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

/**
 * Make a basic elastic search query by uuids
 * @param uuids string array of uuids to be used for elastic search
 */
export function uuidQuery(uuids: string[]) {
  return {
    query: {
      terms: {
        "data.id": uuids
      }
    }
  };
}

/**
 * Generate a range query for getting all the values between two numbers.
 *
 * @param fieldName Fieldname path for the elastic search query.
 * @param value String containing the low and high values represented as a JSON.
 * @param parentType Determines if the query should be nested or not.
 * @param type If being done on a text field, a specific field should be used. (keyword_numeric)
 * @param subType Only applicable for date type, determines if timezone should be included or not.
 */
export function betweenQuery(
  fieldName: string,
  value: string,
  parentType: string | undefined,
  type: SupportedBetweenTypes,
  subType?: string | undefined
) {
  const betweenStates = convertStringToBetweenState(value);

  // Ignore empty between dates.
  if (betweenStates.high === "" || betweenStates.low === "") {
    return {};
  }

  const timezone =
    type === "date"
      ? subType !== "local_date" && subType !== "local_date_time"
        ? getTimezone()
        : undefined
      : undefined;

  return parentType
    ? {
        nested: {
          path: "included",
          query: {
            bool: {
              must: [
                {
                  range: {
                    [fieldName + (type === "text" ? ".keyword_numeric" : "")]: {
                      ...timezone,
                      gte:
                        type === "number"
                          ? Number(betweenStates.low)
                          : betweenStates.low,
                      lte:
                        type === "number"
                          ? Number(betweenStates.high)
                          : betweenStates.high
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
        range: {
          [fieldName + (type === "text" ? ".keyword_numeric" : "")]: {
            ...timezone,
            gte:
              type === "number" ? Number(betweenStates.low) : betweenStates.low,
            lte:
              type === "number"
                ? Number(betweenStates.high)
                : betweenStates.high
          }
        }
      };
}

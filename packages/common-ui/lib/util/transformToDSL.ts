import { QueryRowExportProps } from "../query-builder/QueryRow";
import Bodybuilder from "bodybuilder";
import { LimitOffsetPageSpec } from "..";

export interface TransformQueryToDSLParams {
  queryRows: QueryRowExportProps[];
  group: string;
}

export function transformQueryToDSL(
  pagination: LimitOffsetPageSpec,
  submittedValues: TransformQueryToDSLParams
) {
  const builder = Bodybuilder();

  // Remove the type from value before submit to elastic search.
  submittedValues.queryRows.map(queryRow => {
    console.log(queryRow);

    // Retrieve the type from the brackets.
    queryRow.type = queryRow.fieldName?.substring(
      queryRow.fieldName.indexOf("(") + 1,
      queryRow.fieldName.indexOf(")")
    );
    
    // Retrieve the name before the bracket.
    queryRow.fieldName = queryRow.fieldName?.substring(
      0,
      queryRow.fieldName.indexOf("(")
    );
  });

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
        return queryRow.matchValue ?? ""

      default:
        return null;
    }
  }

  function buildRelationshipQuery(curRow, firstRow, onlyOneRow) {

  }

  /**
   * Used for attributes directly involved with the index. Relationship queries should be using
   * the buildRelationshipQuery function instead.
   * 
   * @param curRow current row.
   * @param firstRow first row (used for AND/OR type searching).
   * @param onlyOneRow boolean if there is only one buildQuery to generate.
   */
  function buildQuery(curRow, firstRow, onlyOneRow) {
    const rowToBuild = firstRow ?? curRow;

    // Special searches like boolean store the value in a different part of the structure.
    const value = getValueBasedOnType(rowToBuild);

    // A single row query option.
    if (onlyOneRow) {
      if (rowToBuild.type === "text" || rowToBuild.type === "keyword") {
        builder.query(
          rowToBuild.matchType as string,
          rowToBuild.matchType === "term"
            ? rowToBuild.fieldName + ".keyword"
            : rowToBuild.fieldName,
          value
        );
      } else {
        builder.filter("term", rowToBuild.fieldName, value);
      }

    // And Query
    } else if (curRow.compoundQueryType === "and") {
      if (rowToBuild.type === "text" || rowToBuild.type === "keyword") {
        builder.andQuery(
          rowToBuild.matchType as string,
          rowToBuild.matchType === "term"
            ? rowToBuild.fieldName + ".keyword"
            : rowToBuild.fieldName,
          value
        );
      } else {
        builder.andFilter("term", rowToBuild.fieldName, value);
      }

    // Or Query
    } else if (curRow.compoundQueryType === "or") {
      if (rowToBuild.type === "text" || rowToBuild.type === "keyword") {
        builder.orFilter(
          rowToBuild.matchType as string,
          rowToBuild.matchType === "term"
            ? rowToBuild.fieldName + ".keyword"
            : rowToBuild.fieldName,
          value
        );
      } else {
        builder.orFilter("term", rowToBuild.fieldName, value);
      }
    }
  }

  const filteredValues = submittedValues.queryRows.filter(
    // Remove the row that user did not select any field to search on or
    // no value is put for the selected field
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
          queryRow.type === "unsiged_long") &&
          queryRow.number) ||
        (queryRow.type === "date" && queryRow.date) ||
        ((queryRow.type === "text" || queryRow.type === "keyword") &&
          queryRow.matchType &&
          queryRow.matchValue))
  );

  filteredValues.map((queryRow, idx) => {
    // Only one row, change the "onlyOneRow" option on buildQuery.
    if (filteredValues.length === 1) buildQuery(queryRow, queryRow, true);
    else {
      if (idx === 1) buildQuery(queryRow, filteredValues[0], false);
      if (idx !== 0) buildQuery(queryRow, null, false);
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

  return builder.build();
}

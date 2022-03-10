import { QueryRowExportProps } from "../query-builder/QueryRow";
import Bodybuilder from "bodybuilder";
import { LimitOffsetPageSpec } from "../api-client/operations-types";

interface TransformQueryToDSLParams {
  queryRows: QueryRowExportProps[];
  group: string;
}

export function transformQueryToDSL(
  submittedValues: TransformQueryToDSLParams,
  pagination: LimitOffsetPageSpec
) {
  const builder = Bodybuilder();

  // Remove the type from value before submit to elastic search
  submittedValues.queryRows.map(queryRow => {
    queryRow.type = queryRow.fieldName?.substring(
      queryRow.fieldName.indexOf("(") + 1,
      queryRow.fieldName.indexOf(")")
    );
    queryRow.fieldName = queryRow.fieldName?.substring(
      0,
      queryRow.fieldName.indexOf("(")
    );
  });

  function buildQuery(curRow, firstRow, onlyOneRow) {
    const rowToBuild = firstRow ?? curRow;
    const value =
      rowToBuild.type === "boolean"
        ? rowToBuild.boolean
        : rowToBuild.type === "long" ||
          rowToBuild.type === "short" ||
          rowToBuild.type === "integer" ||
          rowToBuild.type === "byte" ||
          rowToBuild.type === "double" ||
          rowToBuild.type === "float" ||
          rowToBuild.type === "half_float" ||
          rowToBuild.type === "scaled_float" ||
          rowToBuild.type === "unsiged_long"
        ? rowToBuild.number
        : rowToBuild.type === "date"
        ? rowToBuild.date
        : null;

    if (onlyOneRow) {
      if (rowToBuild.type === "text" || rowToBuild.type === "keyword") {
        builder.query(
          rowToBuild.matchType as string,
          rowToBuild.matchType === "term"
            ? rowToBuild.fieldName + ".keyword"
            : rowToBuild.fieldName,
          rowToBuild.matchValue ?? ""
        );
      } else {
        builder.filter("term", rowToBuild.fieldName, value);
      }
    } else if (curRow.compoundQueryType === "and") {
      if (rowToBuild.type === "text" || rowToBuild.type === "keyword") {
        builder.andQuery(
          rowToBuild.matchType as string,
          rowToBuild.matchType === "term"
            ? rowToBuild.fieldName + ".keyword"
            : rowToBuild.fieldName,
          rowToBuild.matchValue ?? ""
        );
      } else {
        builder.andFilter("term", rowToBuild.fieldName, value);
      }
    } else if (curRow.compoundQueryType === "or") {
      if (rowToBuild.type === "text" || rowToBuild.type === "keyword") {
        builder.orFilter(
          rowToBuild.matchType as string,
          rowToBuild.matchType === "term"
            ? rowToBuild.fieldName + ".keyword"
            : rowToBuild.fieldName,
          rowToBuild.matchValue ?? ""
        );
      } else {
        builder.orFilter("term", rowToBuild.fieldName, value);
      }
    }
  }

  submittedValues.queryRows
    .filter(
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
    )
    .map((queryRow, idx) => {
      if (submittedValues.queryRows.length === 1)
        buildQuery(queryRow, queryRow, true);
      else {
        if (idx === 1)
          buildQuery(queryRow, submittedValues.queryRows[0], false);
        if (idx !== 0) buildQuery(queryRow, null, false);
      }
    });

  if (submittedValues.group)
    builder.andQuery("match", "data.attributes.group", submittedValues.group);

  // Apply pagination rules to elastic search query.
  if (pagination) {
    builder.size(pagination.limit);
    builder.from(pagination.offset);
  }

  return builder.build();
}

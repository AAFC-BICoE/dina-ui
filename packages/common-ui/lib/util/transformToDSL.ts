import { QueryRowExportProps } from "../query-builder/QueryRow";
import Bodybuilder from "bodybuilder";

export function transformQueryToDSL(exportedQueryRows: QueryRowExportProps[]) {
  const builder = Bodybuilder();

  // Remove the type from value before submit to elastic search
  exportedQueryRows.map(queryRow => {
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
        : rowToBuild.type === "number"
        ? rowToBuild.number
        : rowToBuild.date;

    if (onlyOneRow) {
      if (rowToBuild.matchValue) {
        builder.query(
          rowToBuild.matchType as string,
          rowToBuild.fieldName,
          rowToBuild.matchValue
        );
      } else {
        builder.filter("term", rowToBuild.fieldName, value);
      }
    } else if (curRow.compoundQueryType === "and") {
      if (rowToBuild.matchValue) {
        builder.andQuery(
          rowToBuild.matchType as string,
          rowToBuild.fieldName,
          rowToBuild.matchValue
        );
      } else {
        builder.andFilter("term", rowToBuild.fieldName, value);
      }
    } else if (curRow.compoundQueryType === "or") {
      if (rowToBuild.matchValue) {
        builder.orFilter(
          rowToBuild.matchType as string,
          rowToBuild.fieldName,
          rowToBuild.matchValue
        );
      } else {
        builder.orFilter("term", rowToBuild.fieldName, value);
      }
    }
  }

  exportedQueryRows
    .filter(
      // Remove the row that user did not select any field to search on or
      // no value is put for the selected field
      queryRow =>
        queryRow.fieldName &&
        ((queryRow.type === "boolean" && queryRow.boolean) ||
          (queryRow.type === "number" && queryRow.number) ||
          (queryRow.type === "date" && queryRow.date) ||
          queryRow.matchValue)
    )
    .map((queryRow, idx) => {
      if (exportedQueryRows.length === 1) buildQuery(queryRow, queryRow, true);
      else {
        if (idx === 1) buildQuery(queryRow, exportedQueryRows[0], false);
        if (idx !== 0) buildQuery(queryRow, null, false);
      }
    });
  return builder.build();
}

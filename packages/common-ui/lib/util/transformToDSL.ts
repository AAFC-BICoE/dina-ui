import { QueryRowExportProps } from "../query-builder/QueryRow";
import Bodybuilder from "bodybuilder";

export function transformQueryToDSL(exportedQueryRows: QueryRowExportProps[]) {
  const builder = Bodybuilder();

  // Remove the type from value before submit to elastic search
  exportedQueryRows.map(queryRow => {
    queryRow.fieldName = queryRow.fieldName?.substring(
      0,
      queryRow.fieldName.indexOf("(")
    );
  });

  function buildQuery(bldr, curRow, firstRow, onlyOneRow) {
    const rowToBuild = firstRow ?? curRow;
    if (onlyOneRow) {
      if (rowToBuild.matchValue) {
        bldr = bldr.query(
          rowToBuild.matchType as string,
          rowToBuild.fieldName,
          rowToBuild.matchValue
        );
      } else {
        bldr = bldr.filter(
          "term",
          rowToBuild.fieldName,
          rowToBuild.boolean ?? rowToBuild.number ?? rowToBuild.date
        );
      }
    } else if (curRow.compoundQueryType === "and") {
      if (rowToBuild.matchValue) {
        bldr = bldr.andQuery(
          rowToBuild.matchType as string,
          rowToBuild.fieldName,
          rowToBuild.matchValue
        );
      } else {
        bldr = bldr.andFilter(
          "term",
          rowToBuild.fieldName,
          rowToBuild.boolean ?? rowToBuild.number ?? rowToBuild.date
        );
      }
    } else if (curRow.compoundQueryType === "or") {
      if (rowToBuild.matchValue) {
        bldr = bldr.orQuery(
          rowToBuild.matchType as string,
          rowToBuild.fieldName,
          rowToBuild.matchValue
        );
      } else {
        bldr = bldr.orFilter(
          "term",
          rowToBuild.fieldName,
          rowToBuild.boolean ?? rowToBuild.number ?? rowToBuild.date
        );
      }
    }
  }

  exportedQueryRows.map((queryRow, idx) => {
    if (exportedQueryRows.length === 1)
      buildQuery(builder, queryRow, queryRow, true);
    else {
      if (idx === 1) buildQuery(builder, queryRow, exportedQueryRows[0], false);
      if (idx !== 0) buildQuery(builder, queryRow, null, false);
    }
  });

  return builder.build();
}

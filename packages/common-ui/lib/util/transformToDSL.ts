import { QueryRowExportProps } from "../query-builder/QueryRow";
import Bodybuilder from "bodybuilder";

export function transformQueryToDSL(exportedQueryRows: QueryRowExportProps[]) {
  let builder = Bodybuilder();

  // Remove the type from value before submit to elastic search
  exportedQueryRows.map(queryRow => {
    queryRow.fieldName = queryRow.fieldName?.substring(
      0,
      queryRow.fieldName.indexOf("(")
    );
  });

  exportedQueryRows.map((queryRow, idx) => {
    if (queryRow.boolean) {
      // search will be built as filter
      if (queryRow.compoundQueryType === "and") {
        builder = builder.andFilter(
          "term",
          queryRow.fieldName,
          queryRow.boolean
        );
      } else if (queryRow.compoundQueryType === "or") {
        builder = builder.orFilter(
          "term",
          queryRow.fieldName,
          queryRow.boolean
        );
      } else if (idx === 0) {
        builder = builder.filter("term", queryRow.fieldName, queryRow.boolean);
      }
    } else if (queryRow.date) {
      // search will be built as filter
      if (queryRow.compoundQueryType === "and") {
        builder = builder.andFilter("term", queryRow.fieldName, queryRow.date);
      } else if (queryRow.compoundQueryType === "or") {
        builder = builder.orFilter("term", queryRow.fieldName, queryRow.date);
      } else if (idx === 0) {
        builder = builder.filter("term", queryRow.fieldName, queryRow.date);
      }
    } else if (queryRow.number) {
      // search will be built as filter
      if (queryRow.compoundQueryType === "and") {
        builder = builder.andFilter(
          "term",
          queryRow.fieldName,
          queryRow.number
        );
      } else if (queryRow.compoundQueryType === "or") {
        builder = builder.orFilter("term", queryRow.fieldName, queryRow.number);
      } else if (idx === 0) {
        builder = builder.filter("term", queryRow.fieldName, queryRow.number);
      }
    } else if (queryRow.matchValue) {
      // string search will be built as query
      if (queryRow.compoundQueryType === "and") {
        builder = builder.andQuery(
          queryRow.matchType as string,
          queryRow.fieldName,
          queryRow.matchValue
        );
      } else if (queryRow.compoundQueryType === "or") {
        builder = builder.orQuery(
          queryRow.matchType as string,
          queryRow.fieldName,
          queryRow.matchValue
        );
      } else if (idx === 0) {
        builder = builder.query(
          queryRow.matchType as string,
          queryRow.fieldName,
          queryRow.matchValue
        );
      }
    }
  });
  return builder.build();
}

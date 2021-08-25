import { transformToRSQL } from "@molgenis/rsql";
import { FilterParam } from "kitsu";

interface RsqlFilterOptions {
  extraFilters?: RsqlFilterObject[];
}

interface RsqlFilterObject {
  /** The field name. */
  selector: string;

  /** The comparison operator. */
  comparison: "==" | "!=" | "=ge=" | "=gt=" | "=le=" | "=lt=";

  /** The search value. */
  arguments: string;
}

/**
 * Accepts an array of field names and a value, and returns a JSONAPI filter param that filters
 * by those fields using partial matching.
 */
export function filterBy(
  /**
   * The fields to be searched on using an OR operator.
   * e.g. ["name", "version"] searches by "name" OR "version"
   */
  fields: string[],
  options?: RsqlFilterOptions
): (value: string) => Record<string, string> | {} {
  return value => ({
    rsql: (transformToRSQL as any)({
      operator: "AND",
      operands: [
        ...(value
          ? [
              {
                operands: fields.map(field => ({
                  arguments: `*${value}*`,
                  comparison: "==",
                  selector: field
                })),
                operator: "OR"
              }
            ]
          : []),
        ...(options?.extraFilters ?? [])
      ]
    })
  });
}

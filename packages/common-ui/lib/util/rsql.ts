import { transformToRSQL } from "@molgenis/rsql";
import { FilterParam } from "kitsu";

/**
 * Accepts an array of field names and a value, and returns a JSONAPI filter param that filters
 * by those fields using partial matching.
 */
export function filterBy(
  fields: string[]
): (value: string) => Record<string, string> | {} {
  return value =>
    value
      ? {
          rsql: (transformToRSQL as any)({
            operands: fields.map(field => ({
              arguments: `*${value}*`,
              comparison: "==",
              selector: field
            })),
            operator: "OR"
          })
        }
      : {};
}

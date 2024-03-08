import { transformToRSQL } from "@molgenis/rsql";

export interface RsqlFilterOptions {
  extraFilters?: RsqlFilterObject[];
  nullValueFilters?: {};
}

export interface RsqlFilterObject {
  /** The field name. */
  selector: string;

  /** The comparison operator. */
  comparison:
    | "=="
    | "!="
    | "=ge="
    | "=gt="
    | "=le="
    | "=lt="
    | "=in="
    | "=out=";

  /** The search value. */
  arguments: string | string[];
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
  const otherFilters = options?.nullValueFilters;
  return (value) => {
    const rsqlFilter = (transformToRSQL as any)({
      operator: "AND",
      operands: [
        ...(value
          ? [
              {
                operands: fields.map((field) => ({
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
    });

    const combinedFilters = { ...{ rsql: rsqlFilter }, ...otherFilters };
    return combinedFilters;
  };
}

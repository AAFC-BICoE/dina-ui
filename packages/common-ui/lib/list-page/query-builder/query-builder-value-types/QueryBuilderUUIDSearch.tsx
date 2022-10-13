export interface TransformUUIDSearchToDSL {
  fieldPath: string;
  value: string;
}

/**
 * Using the query row for a UUID search, generate the elastic search request to be made.
 */
export function transformUUIDSearchToDSL({
  fieldPath,
  value
}: TransformUUIDSearchToDSL): any {
  return {
    term: {
      [fieldPath]: value
    }
  };
}

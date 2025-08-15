import { omit } from "lodash";
import { PersistedResource } from "kitsu";

/**
 * Parses the specified relationship fields from a resource object, extracting their `data` property if present.
 *
 * @param relationships - An array of relationship field names to parse from the resource.
 * @param data - The response object containing relationship fields.
 * @returns A new resource object with the specified relationships replaced by their `data` property.
 */
export function baseRelationshipParser(
  relationships: string[],
  data: PersistedResource<any>
): PersistedResource<any> {
  const parsedObject = {
    ...omit(data, relationships)
  } as PersistedResource<any>;

  relationships.forEach((relationship) => {
    if (data[relationship] && data[relationship].data) {
      parsedObject[relationship] = data[relationship].data;
    }
  });

  return parsedObject;
}

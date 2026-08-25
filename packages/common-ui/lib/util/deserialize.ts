/**
 * Deserializes a standard JSON:API payload into flattened JavaScript objects.
 *
 * Eventually, this function will completely replace the Kitsu deseralise so we can have more
 * control over it.
 *
 * Flattens resource `attributes` onto top-level objects and recursively resolves
 * resource references in `relationships` using the provided `included` array (if provided)
 *
 * @param jsonApiPayload - The raw JSON:API document containing `data` and optional `included` resources.
 * @returns The deserialized resource object, an array of resource objects, or the untouched input
 *  if `data` is missing or invalid.
 */
export function deserialize(jsonApiPayload: any): any {
  if (!jsonApiPayload || typeof jsonApiPayload !== "object") {
    return jsonApiPayload;
  }

  const { data, included = [] } = jsonApiPayload;
  if (!data) return jsonApiPayload;

  // Collect map of all the included resources
  const includedMap = new Map<string, any>();
  for (const item of included) {
    if (item?.id && item?.type) {
      includedMap.set(`${item.type}:${item.id}`, item);
    }
  }

  const deserializeResource = (resource: any): any => {
    if (!resource || typeof resource !== "object") return resource;

    const { id, type, attributes = {}, relationships = {} } = resource;

    // Flatten attributes to top-level object
    const result: any = { id, type, ...attributes };

    // Resolve relationships from included map
    for (const [relName, relValue] of Object.entries<any>(relationships)) {
      const relData = relValue?.data;

      if (Array.isArray(relData)) {
        result[relName] = relData.map((relItem) => {
          const matched = includedMap.get(`${relItem.type}:${relItem.id}`);
          return matched ? deserializeResource(matched) : relItem;
        });
      } else if (relData) {
        const matched = includedMap.get(`${relData.type}:${relData.id}`);
        result[relName] = matched ? deserializeResource(matched) : relData;
      }
    }

    // Return the deserialized object
    return result;
  };

  if (Array.isArray(data)) {
    return data.map(deserializeResource);
  }

  return deserializeResource(data);
}

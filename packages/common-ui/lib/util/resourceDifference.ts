import { InputResource, KitsuResource } from "kitsu";
import _ from "lodash";

export interface ResourceDifferenceParams<T extends KitsuResource> {
  updated: T;
  original: T;
}

/**
 * Gets the changes from one resource to another for a save
 * operation without including the unchanged fields.
 */
export function resourceDifference<T extends KitsuResource>({
  updated,
  original
}: ResourceDifferenceParams<T>): InputResource<T> {
  return _.transform<any, InputResource<T>>(updated, (result, value, key) => {
    // This condition handles clearing a to-one relationship that didn't exist before.
    if (updated[key]?.id === null && !original[key]?.id) {
      return;
    } else if (
      // If the array is empty and it's not included on the other object,
      // this is not a meaningful change and should not be included in the diff.
      Array.isArray(value) &&
      value.length === 0 &&
      original[key] === undefined
    ) {
      return;
    } else if (
      // Always include "type" and "id".
      ["type", "id"].includes(key) ||
      // Include any other fields that have changed.
      !_.isEqual(value, original[key])
    ) {
      result[key] = value;
    }
  });
}

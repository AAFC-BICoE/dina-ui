import { ClearType } from "common-ui";
import _ from "lodash";

/**
 * Applies requested field clearances to a given resource object.
 *
 * @param resource - The object being updated/saved
 * @param clearedFields - Map or Iterable of [fieldName, clearType] entries
 */
export function applyClearedFields(
  resource: Record<string, any>,
  clearedFields?: Map<string, ClearType> | null
): void {
  if (!clearedFields?.size) return;

  for (const [fieldName, clearType] of clearedFields) {
    _.set(resource, fieldName, clearType === ClearType.EmptyString ? "" : null);
  }
}

/**
 * Appends new array values to existing array fields on a target resource,
 * deduplicating the resulting combined array.
 *
 * @param targetResource - The target object being modified (e.g., saveOp.resource)
 * @param originalResource - The original unedited source object
 * @param appendFields - Set, Array, or Iterable of field paths to process
 */
export function applyAppendedFields(
  targetResource: Record<string, any>,
  originalResource: Record<string, any>,
  appendFields?: Set<string> | Iterable<string> | null
): void {
  if (!appendFields) return;

  for (const fieldName of appendFields) {
    // Fetch original initial values from original unedited resource
    const originalValue = _.get(originalResource, fieldName);
    const existingArray: string[] = Array.isArray(originalValue)
      ? originalValue
      : [];

    // Fetch new values added in the bulk edit form / save operation
    const formValue = _.get(targetResource, fieldName);
    const bulkInputArray: string[] = Array.isArray(formValue) ? formValue : [];

    // Check if there is anything to append, if not then skip this.
    if (bulkInputArray.length > 0) {
      // Combine original + new values and remove duplicates if there are new items
      const mergedValue = _.uniq([...existingArray, ...bulkInputArray]);
      _.set(targetResource, fieldName, mergedValue);
    }
  }
}

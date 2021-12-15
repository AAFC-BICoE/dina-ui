import { isArray, omitBy } from "lodash";

/**
 * Checks whether an API resource's attribute is blank.
 * This is used to check which of the Bulk Edit tab's values were deliberately edited.
 */
export function isBlankResourceAttribute(value: any) {
  // "blank" means something different depending on the type:
  switch (typeof value) {
    case "string":
      // Empty string:
      return !value.trim();
    case "object":
    case "undefined":
      // empty object or empty array:
      return isArray(value) ? !value.join() : !value?.id;
    default:
      return false;
  }
}

export function withoutBlankFields<T>(original: T): Partial<T> {
  return omitBy(original, isBlankResourceAttribute) as Partial<T>;
}

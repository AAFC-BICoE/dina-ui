import { isArray, omitBy, isEmpty } from "lodash";

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
      if (value?.id === null) {
        return false;
      }

      return isEmpty(value);
    default:
      return false;
  }
}

export function withoutBlankFields<T>(original: T): { [P in keyof T]: T[P] } {
  const overridenObject = omitBy(original as any, isBlankResourceAttribute) as {
    [P in keyof T]: T[P];
  };
  return overridenObject;
}

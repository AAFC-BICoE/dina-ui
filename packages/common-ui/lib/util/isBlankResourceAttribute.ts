import { omitBy, isEmpty } from "lodash";

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
        return true;
      }

      return isEmpty(value);
    default:
      return false;
  }
}

export function withoutBlankFields<T>(
  preprocessed: T,
  original?: T
): { [P in keyof T]: T[P] } {
  const overriddenObject = omitBy(
    preprocessed as any,
    isBlankResourceAttribute
  ) as {
    [P in keyof T]: T[P];
  };
  if (
    (preprocessed as any)?.dcCreator &&
    (preprocessed as any)?.dcCreator?.id === null
  ) {
    (overriddenObject as any).dcCreator = (preprocessed as any)?.dcCreator;
  }
  if (
    (original as any)?.preparedBy &&
    (original as any)?.preparedBy.length === 0
  ) {
    (overriddenObject as any).preparedBy = (preprocessed as any)?.preparedBy;
  }
  return overriddenObject;
}

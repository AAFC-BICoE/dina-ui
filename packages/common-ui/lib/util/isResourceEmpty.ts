/**
 * Function to check if the object only contains 'id' and 'type'
 *
 * @param obj Object to check against.
 * @returns true if empty resource, false if contains other keys.
 */
export function isResourceEmpty(obj: any): boolean {
  if (obj === undefined || obj === null) {
    return true;
  }

  // Filter out keys that have undefined values. resourceVersion is always
  // included by resourceDifference(), so it doesn't count as a real change.
  const definedKeys = Object.keys(obj).filter(
    (key) => obj[key] !== undefined && key !== "resourceVersion"
  );

  return (
    definedKeys.length === 2 &&
    definedKeys.includes("id") &&
    definedKeys.includes("type")
  );
}

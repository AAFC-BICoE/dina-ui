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

  // Filter out keys that have undefined values
  const definedKeys = Object.keys(obj).filter((key) => obj[key] !== undefined);

  return (
    definedKeys.length === 2 &&
    definedKeys.includes("id") &&
    definedKeys.includes("type")
  );
}

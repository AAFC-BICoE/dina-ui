// Function to check if the object only contains 'id' and 'type'
export function isResourceEmpty(obj: any): boolean {
  if (obj === undefined || obj === null) {
    return true;
  }

  const keys = Object.keys(obj);
  return keys.length === 2 && keys.includes("id") && keys.includes("type");
}

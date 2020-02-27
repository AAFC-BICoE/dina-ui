/** Returns a user-readable date string. */
export function readableDate(isoString?: string) {
  return isoString ? new Date(isoString).toLocaleString() : "";
}

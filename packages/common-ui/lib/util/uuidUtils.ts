/**
 * Matches a UUID of any version anywhere within a string (e.g. to extract an id from a message).
 *
 * The "uuid" package's validate function only accepts versions 1-5, which rejects the UUIDv7 ids
 * used by DINA.
 */
export const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const FULL_UUID_PATTERN = new RegExp(
  `^${UUID_PATTERN.source}$`,
  UUID_PATTERN.flags
);

/** Returns true if the entire value is a UUID of any version. */
export function isValidUuid(value: string): boolean {
  return FULL_UUID_PATTERN.test(value);
}

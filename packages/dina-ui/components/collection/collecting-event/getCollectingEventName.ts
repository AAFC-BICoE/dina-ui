import { CollectingEvent } from "../../../types/collection-api";

/**
 * A user friendly name for a collecting event: its collection number if it has one, then the
 * other numbers, falling back to the verbatim locality and finally the id.
 */
export function getCollectingEventName(
  collectingEvent: Partial<CollectingEvent>
): string | undefined {
  return (
    collectingEvent.dwcFieldNumber ||
    collectingEvent.dwcRecordNumber ||
    collectingEvent.otherRecordNumbers?.join(", ") ||
    collectingEvent.dwcVerbatimLocality ||
    collectingEvent.id
  );
}

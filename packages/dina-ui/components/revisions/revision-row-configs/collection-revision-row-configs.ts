import { RevisionRowConfigsByType } from "../revision-row-config";
import { COLLECTING_EVENT_REVISION_ROW_CONFIG } from "./collectingevent-revision-row-config";

/** Custom revision row behavior for Object Store Resources. */
export const COLLECTION_REVISION_ROW_CONFIG: RevisionRowConfigsByType = {
  collectingEvent: COLLECTING_EVENT_REVISION_ROW_CONFIG
};

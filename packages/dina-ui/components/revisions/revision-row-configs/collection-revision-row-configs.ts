import { RevisionRowConfigsByType } from "../revision-row-config";
import { COLLECTING_EVENT_REVISION_ROW_CONFIG } from "./collectingevent-revision-row-config";
import { GEOREFERENCE_ASSERTION_REVISION_ROW_CONFIG } from "./georeference-assertion-revision-row-config";

/** Custom revision row behavior for Object Store Resources. */
export const COLLECTION_REVISION_ROW_CONFIG: RevisionRowConfigsByType = {
  "collecting-event": COLLECTING_EVENT_REVISION_ROW_CONFIG,
  "georeference-assertion": GEOREFERENCE_ASSERTION_REVISION_ROW_CONFIG
};

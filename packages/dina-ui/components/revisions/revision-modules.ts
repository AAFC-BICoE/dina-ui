import { RevisionRowConfigsByType } from "./revision-row-config";
import { COLLECTING_EVENT_REVISION_ROW_CONFIG } from "./revision-row-configs/collectingevent-revision-row-config";
import { MATERIAL_SAMPLE_REVISION_ROW_CONFIG } from "./revision-row-configs/material-sample-revision-row-configs";
import { METADATA_REVISION_ROW_CONFIG } from "./revision-row-configs/metadata-revision-row-config";

/** Custom revision row behavior for Object Store Resources. */
export const OBJECT_STORE_REVISION_ROW_CONFIG: RevisionRowConfigsByType = {
  metadata: METADATA_REVISION_ROW_CONFIG
};

/** Custom revision row behavior for Object Store Resources. */
export const COLLECTION_REVISION_ROW_CONFIG: RevisionRowConfigsByType = {
  "collecting-event": COLLECTING_EVENT_REVISION_ROW_CONFIG,
  "material-sample": MATERIAL_SAMPLE_REVISION_ROW_CONFIG
};

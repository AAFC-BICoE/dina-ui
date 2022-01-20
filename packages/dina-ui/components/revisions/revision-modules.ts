import { RevisionRowConfigsByType } from "./revision-row-config";
import { ACQUISITION_EVENT_REVISION_ROW_CONFIG } from "./revision-row-configs/acquisition-event-revision-config";
import { COLLECTING_EVENT_REVISION_ROW_CONFIG } from "./revision-row-configs/collectingevent-revision-config";
import { COLLECTION_REVISION_ROW_CONFIG } from "./revision-row-configs/collection-revision-config";
import { INSTITUTION_REVISION_ROW_CONFIG } from "./revision-row-configs/institution-revision-config";
import { MATERIAL_SAMPLE_REVISION_ROW_CONFIG } from "./revision-row-configs/material-sample-revision-configs";
import { METADATA_REVISION_ROW_CONFIG } from "./revision-row-configs/metadata-revision-config";
import { PROJECT_REVISION_ROW_CONFIG } from "./revision-row-configs/project-revision-config";
import { STORAGE_UNIT_REVISION_ROW_CONFIG } from "./revision-row-configs/storage-unit-revision-config";

/** Custom revision row behavior for Object Store Resources. */
export const OBJECT_STORE_MODULE_REVISION_ROW_CONFIG: RevisionRowConfigsByType =
  { metadata: METADATA_REVISION_ROW_CONFIG };

/** Custom revision row behavior for Object Store Resources. */
export const COLLECTION_MODULE_REVISION_ROW_CONFIG: RevisionRowConfigsByType = {
  "collecting-event": COLLECTING_EVENT_REVISION_ROW_CONFIG,
  "material-sample": MATERIAL_SAMPLE_REVISION_ROW_CONFIG,
  collection: COLLECTION_REVISION_ROW_CONFIG,
  project: PROJECT_REVISION_ROW_CONFIG,
  institution: INSTITUTION_REVISION_ROW_CONFIG,
  "acquisition-event": ACQUISITION_EVENT_REVISION_ROW_CONFIG,
  "storage-unit": STORAGE_UNIT_REVISION_ROW_CONFIG
};

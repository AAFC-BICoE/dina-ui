import { METADATA_REVISION_ROW_CONFIG } from "./metadata-revision-row-config";
import { RevisionRowConfigsByType } from "../revision-row-config";

/** Custom revision row behavior for Object Store Resources. */
export const OBJECT_STORE_REVISION_ROW_CONFIG: RevisionRowConfigsByType = {
  metadata: METADATA_REVISION_ROW_CONFIG
};

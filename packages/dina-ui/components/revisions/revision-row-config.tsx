import { ComponentType } from "react";
import { CellInfo } from "react-table";
import { METADATA_REVISION_ROW_CONFIG } from "./revision-row-configs/metadata-revision-row-config";

// Custom Revision table row rendering per type

export type RevisionRowConfigsByType = Record<string, RevisionRowConfig<any>>;

export interface RevisionRowConfig<T> {
  /** The name/link shown in the "Resource Name" column. */
  name?: ComponentType<T>;

  /** Custom renderers for complex cell values. */
  customValueCells?: Record<string, ComponentType<CellInfo>>;
}

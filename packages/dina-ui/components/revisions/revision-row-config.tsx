import { ComponentType } from "react";
import { CellContext, ColumnDefTemplate } from "@tanstack/react-table";

// Custom Revision table row rendering per type

// export type RevisionRowConfigsByType = Record<string, RevisionRowConfig<any>>;

// export interface RevisionRowConfig<T> {
//   /** The name/link shown in the "Resource Name" column. */
//   name?: ComponentType<T>;

//   /** Custom renderers for complex cell values. */
//   customValueCells?: Record<string, ComponentType<CellInfo>>;
// }

export type RevisionRowConfigsByType = Record<string, RevisionRowConfig<any>>;

export interface RevisionRowConfig<T> {
  /** The name/link shown in the "Resource Name" column. */
  name?: ComponentType<T>;

  /** Custom renderers for complex cell values. */
  customValueCells?: Record<string, ColumnDefTemplate<CellContext<any, any>>>;
}

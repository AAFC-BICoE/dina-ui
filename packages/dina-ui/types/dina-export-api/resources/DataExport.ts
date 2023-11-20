import { KitsuResource } from "kitsu";

export type ExportStatus = "NEW" | "RUNNING" | "COMPLETED" | "ERROR";

export interface DataExportAttributes {
  type: "data-export";
  status?: ExportStatus;
  createdOn?: string;
  createdBy?: string;
  source?: string;
  query?: string;
  columns?: string[];
}

export type DataExport = KitsuResource & DataExportAttributes;

import { KitsuResource } from "kitsu";

export type ExportStatus = "NEW" | "RUNNING" | "COMPLETED" | "ERROR";
export type ExportType = "TABULAR_DATA" | "OBJECT_ARCHIVE";

export interface DataExportAttributes {
  type: "data-export";
  status?: ExportStatus;
  createdOn?: string;
  createdBy?: string;
  source?: string;
  query?: string;
  columns?: string[];
  name?: string;
  exportType?: ExportType;
}

export type DataExport = KitsuResource & DataExportAttributes;

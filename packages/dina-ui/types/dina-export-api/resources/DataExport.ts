import { KitsuResource } from "kitsu";

export type ExportStatus = "NEW" | "RUNNING" | "COMPLETED" | "ERROR";
export type ExportType = "TABULAR_DATA" | "OBJECT_ARCHIVE";
export type FunctionName = "CONCAT" | "CONVERT_COORDINATES_DD";
export type ColumnSeparator = "COMMA" | "TAB";

export interface FunctionDef {
  functionName: FunctionName;
  params: string[];
}

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
  exportOptions?: ExportOptions;
  columnAliases?: string[];
  columnFunctions?: Record<string, FunctionDef>;
}

export interface ExportOptions {
  columnSeparator?: ColumnSeparator; // Known key with a string value
  [key: string]: string | undefined; // Allow additional string-based key-value pairs
}

export type DataExport = KitsuResource & DataExportAttributes;

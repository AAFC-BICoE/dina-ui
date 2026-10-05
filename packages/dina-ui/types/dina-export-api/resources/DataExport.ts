import { KitsuResource } from "kitsu";
import { DatasetAttributes } from "../../collection-api/resources/Dataset";

export type ExportStatus = "NEW" | "RUNNING" | "COMPLETED" | "ERROR";
export type ExportType = "TABULAR_DATA" | "OBJECT_ARCHIVE" | "DWCA";
export type FunctionDefinitions = "CONCAT" | "CONVERT_COORDINATES_DD";
export type ColumnSeparator = "COMMA" | "TAB";

export type DataExportDataset = Omit<
  DatasetAttributes,
  "type" | "createdOn" | "createdBy"
> & { uuid: string };

export interface FunctionDef {
  functionDef: FunctionDefinitions;
  params: { [key: string]: any };
}

export interface EntitySchema {
  columns: string[];
  aliases?: string[];
}

export interface DataExportAttributes {
  type: "data-export";
  status?: ExportStatus;
  createdOn?: string;
  createdBy?: string;
  source?: string;
  query?: string;
  name?: string;
  exportType?: ExportType;
  exportOptions?: ExportOptions;
  schema?: Record<string, EntitySchema>;
  functions?: Record<string, FunctionDef>;
  dataset?: DataExportDataset;
}

export interface ExportOptions {
  columnSeparator?: ColumnSeparator; // Known key with a string value
  [key: string]: string | undefined; // Allow additional string-based key-value pairs
}

export type DataExport = KitsuResource & DataExportAttributes;

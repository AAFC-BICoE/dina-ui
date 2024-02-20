import { KitsuResource } from "kitsu";

export interface ObjectExportAttributes {
  type: "object-export";
  fileIdentifiers: string[];
}

export type ObjectExport = KitsuResource & ObjectExportAttributes;

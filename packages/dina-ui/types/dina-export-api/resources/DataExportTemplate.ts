import { KitsuResource } from "kitsu";
import {
  ExportType,
  ExportOptions,
  FunctionDef,
  EntitySchema
} from "./DataExport";

export interface DataExportTemplateAttributes {
  type: "data-export-template";
  createdOn?: string;
  createdBy?: string;
  group?: string;

  restrictToCreatedBy: boolean;
  publiclyReleasable: boolean;

  name?: string;
  exportType: ExportType;
  exportOptions?: ExportOptions;

  schema?: Record<string, EntitySchema>;
  functions?: Record<string, FunctionDef>;
}

export type DataExportTemplate = KitsuResource & DataExportTemplateAttributes;

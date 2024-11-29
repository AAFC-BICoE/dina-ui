import { KitsuResource } from "kitsu";
import { MultilingualDescription } from "../../common";

export interface ReportTemplateAttributes {
  type: "report-template";
  name: string;
  group: string;
  createdOn?: string;
  createdBy: string;
  multilingualDescription?: MultilingualDescription;
  templateFilename?: string;
  outputMediaType?: string;
  includesBarcode?: boolean;
  templateOutputMediaType?: string;
  reportVariables?: string[];
  reportType?: ReportType;
}

export enum ReportType {
  "MATERIAL_SAMPLE_LABEL",
  "STORAGE_LABEL"
}

export type ReportTemplate = KitsuResource & ReportTemplateAttributes;

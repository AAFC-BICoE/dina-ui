import { KitsuResource } from "kitsu";
import { MultilingualDescription } from "../../common";

export interface ReportTemplateAttributes {
  type: "report-template";
  name: string;
  group: string;
  createdOn?: string;
  createdBy: string;
  multilingualDescription?: MultilingualDescription;
  templateFilename: string;
  outputMediaType: string;
  includesBarcode: boolean;
}

export type ReportTemplate = KitsuResource & ReportTemplateAttributes;

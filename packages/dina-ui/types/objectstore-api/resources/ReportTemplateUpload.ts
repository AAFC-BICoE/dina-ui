import { KitsuResource } from "kitsu";

export interface ReportTemplateUploadAttributes {
  type: string;
  fileIdentifier?: string;
}

export type ReportTemplateUpload = KitsuResource &
  ReportTemplateUploadAttributes;

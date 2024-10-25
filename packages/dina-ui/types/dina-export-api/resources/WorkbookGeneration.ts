import { KitsuResource } from "kitsu";

export interface WorkbookGenerationAttributes {
  type: "workbook-generation";
  columns: string[];
  aliases?: string[];
}

export type WorkbookGeneration = KitsuResource & WorkbookGenerationAttributes;

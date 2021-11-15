import { KitsuResource } from "kitsu";
import { MultilingualDescription } from "..";

export interface ProjectAttributes {
  type: "project";
  name: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  multilingualDescription?: MultilingualDescription;
}

export type Project = KitsuResource & ProjectAttributes;

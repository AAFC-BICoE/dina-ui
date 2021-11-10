import { KitsuResource } from "kitsu";

export interface MaterialSampleTypeAttributes {
  type: "material-sample-type";
  name: string;
  createdBy?: string;
  createdOn?: string;
}

export type MaterialSampleType = KitsuResource & MaterialSampleTypeAttributes;

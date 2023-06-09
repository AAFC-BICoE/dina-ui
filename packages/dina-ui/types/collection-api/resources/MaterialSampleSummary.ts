import { KitsuResource } from "kitsu";
import { Determination } from "./Determination";

export interface MaterialSampleSummaryAttributes {
  type: "material-sample-summary";
  materialSampleName?: string;
  effectiveDeterminations?: Determination[];
}

export type MaterialSampleSummary = KitsuResource &
  MaterialSampleSummaryAttributes;

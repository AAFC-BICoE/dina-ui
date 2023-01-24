import { KitsuResource } from "kitsu";

export interface MaterialSampleIdentifierGeneratorAttributes {
  type: "material-sample-identifier-generator";
  identifier: string;
  amount: number;
  nextIdentifiers?: string[];
}

export type MaterialSampleIdentifierGenerator = KitsuResource &
  MaterialSampleIdentifierGeneratorAttributes;

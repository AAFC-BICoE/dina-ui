import { KitsuResource } from "kitsu";

export interface InstitutionAttributes {
  createdOn?: string;
  createdBy?: string;
  name?: string;
  multilingualDescription?: {
    descriptions?:
      | {
          lang?: string | null;
          desc?: string | null;
        }[]
      | null;
  };
}

export type Institution = KitsuResource & InstitutionAttributes;

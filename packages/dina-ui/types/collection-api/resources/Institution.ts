import { KitsuResource } from "kitsu";
import { HasDinaMetaInfo } from "../../DinaJsonMetaInfo";

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
  webpage?: string;
  address?: string;
  remarks?: string;
}

export type Institution = KitsuResource &
  InstitutionAttributes &
  HasDinaMetaInfo;

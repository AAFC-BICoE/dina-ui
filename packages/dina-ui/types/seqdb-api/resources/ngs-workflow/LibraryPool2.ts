import { KitsuResource } from "kitsu";
import { LibraryPoolContent2 } from "./LibraryPoolContent2";

interface LibraryPoolAttributes {
  name: string;
  type: "library-pool";
  dateUsed?: string;
  notes?: string;
  group?: string;
  createdBy?: string;
  createdOn?: string;
}

interface LibraryPoolRelationships {
  contents?: LibraryPoolContent2[];
}

export type LibraryPool2 = KitsuResource &
  LibraryPoolAttributes &
  LibraryPoolRelationships;

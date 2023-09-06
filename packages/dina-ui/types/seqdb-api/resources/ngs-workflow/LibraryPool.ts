import { KitsuResource } from "kitsu";
import { LibraryPoolContent as LibraryPoolContent } from "./LibraryPoolContent";

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
  contents?: LibraryPoolContent[];
}

export type LibraryPool = KitsuResource &
  LibraryPoolAttributes &
  LibraryPoolRelationships;

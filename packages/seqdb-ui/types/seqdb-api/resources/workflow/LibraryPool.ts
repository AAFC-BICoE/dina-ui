import { KitsuResource } from "kitsu";

interface LibraryPoolAttributes {
  name: string;
  type: "libraryPool";
}

// interface LibraryPoolRelationships {}

export type LibraryPool = KitsuResource & LibraryPoolAttributes;

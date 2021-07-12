import { KitsuResource } from "kitsu";

interface LibraryPoolAttributes {
  name: string;
  type: "library-pool";
}

// interface LibraryPoolRelationships {}

export type LibraryPool = KitsuResource & LibraryPoolAttributes;

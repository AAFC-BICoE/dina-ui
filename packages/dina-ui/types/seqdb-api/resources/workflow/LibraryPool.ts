import { KitsuResource } from "kitsu";

interface LibraryPoolAttributes {
  name: string;
  type: "library-pool";
  group?: string;
}

// interface LibraryPoolRelationships {}

export type LibraryPool = KitsuResource & LibraryPoolAttributes;

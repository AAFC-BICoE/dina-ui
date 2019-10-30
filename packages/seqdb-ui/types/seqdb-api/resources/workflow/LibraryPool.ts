import { KitsuResource } from "kitsu";

interface LibraryPoolAttributes {
  name: string;
}

// interface LibraryPoolRelationships {}

export type LibraryPool = KitsuResource & LibraryPoolAttributes;

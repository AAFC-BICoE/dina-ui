import { KitsuResource } from "kitsu";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { NgsIndex } from "../workflow/NgsIndex";
import { LibraryPrepBatch2 } from "./LibraryPrepBatch2";

interface LibraryPrepAttributes {
  type: "library-prep";
  inputNg?: number | null;
  quality?: string | null;
  size?: string | null;
  wellColumn?: number | null;
  wellRow?: string | null;
  group?: string;
  createdBy?: string;
  createdOn?: string;
}

interface LibraryPrepRelationships {
  libraryPrepBatch: LibraryPrepBatch2;
  materialSample?: MaterialSample;
  indexI5?: NgsIndex | null;
  indexI7?: NgsIndex | null;
}

export type LibraryPrep2 = KitsuResource &
  LibraryPrepAttributes &
  LibraryPrepRelationships;

import { KitsuResource } from "kitsu";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { NgsIndex } from "./NgsIndex";
import { LibraryPrepBatch } from "./LibraryPrepBatch";
import { ResourceIdentifierObject } from "jsonapi-typescript";

interface LibraryPrepAttributes {
  type: "library-prep";
  inputNg?: number | null;
  quality?: string | null;
  size?: string | null;
  group?: string;
  createdBy?: string;
  createdOn?: string;
}

interface LibraryPrepRelationships {
  libraryPrepBatch: LibraryPrepBatch;
  materialSample?: MaterialSample;
  indexI5?: NgsIndex | null;
  indexI7?: NgsIndex | null;
  storageUnit?: ResourceIdentifierObject;
}

export type LibraryPrep = KitsuResource &
  LibraryPrepAttributes &
  LibraryPrepRelationships;

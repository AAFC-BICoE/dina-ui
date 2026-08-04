export const COLLECTION_MODULE_TYPES = [
  "ASSEMBLAGE",
  "COLLECTING_EVENT",
  "DETERMINATION",
  "MATERIAL_SAMPLE",
  "ORGANISM",
  "PREPARATION",
  "SITE",
  "COLLECTION",
  "PROJECT"
] as const;
export type CollectionModuleType = (typeof COLLECTION_MODULE_TYPES)[number];
export const COLLECTION_MODULE_TYPE_LABELS: Record<
  CollectionModuleType,
  string
> = {
  ASSEMBLAGE: "assemblage",
  COLLECTING_EVENT: "collectingEvent",
  DETERMINATION: "determination",
  MATERIAL_SAMPLE: "materialSample",
  ORGANISM: "organism",
  PREPARATION: "preparation",
  SITE: "site",
  COLLECTION: "collection",
  PROJECT: "project"
};

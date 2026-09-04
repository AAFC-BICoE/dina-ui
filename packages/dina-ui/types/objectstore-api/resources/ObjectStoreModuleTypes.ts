export const OBJECT_STORE_MODULE_TYPES = ["METADATA"] as const;
export type ObjectStoreModuleType = (typeof OBJECT_STORE_MODULE_TYPES)[number];
export const OBJECT_STORE_MODULE_TYPE_LABELS: Record<
  ObjectStoreModuleType,
  string
> = {
  METADATA: "metadata"
};

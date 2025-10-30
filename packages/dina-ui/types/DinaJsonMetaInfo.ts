export interface DinaJsonMetaInfo {
  permissionsProvider?: string;
  permissions?: string[];
  warnings?: Record<string, object>;
}

// Used for permission information included on the request.
export interface HasDinaMetaInfo {
  meta?: DinaJsonMetaInfo;
}

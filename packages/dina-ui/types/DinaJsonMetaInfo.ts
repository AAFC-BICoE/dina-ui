export interface DinaJsonMetaInfo {
  permissionsProvider?: string;
  permissions?: string[];
  warnings?: Record<string, object>;
}

export interface HasDinaMetaInfo {
  meta?: DinaJsonMetaInfo;
}

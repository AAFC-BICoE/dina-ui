export interface DinaJsonMetaInfo {
  permissionsProvider?: string;
  permissions?: string[];
  warnings?: Record<string, any>;
}

export interface HasDinaMetaInfo {
  meta?: DinaJsonMetaInfo;
}

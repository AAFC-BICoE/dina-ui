import { KitsuResource } from "kitsu";

export interface PermissionCheckAttributes {
  type: "permission-check";
  targetType: string;
  permissions: string[];
  permissionsProvider: string;
  evaluatedAttributes: string[];
}

export type PermissionCheck = KitsuResource & PermissionCheckAttributes;

export interface PermissionCheckResponse {
  data: {
    id: string;
    type: string;
    attributes: PermissionCheckAttributes;
  };
}

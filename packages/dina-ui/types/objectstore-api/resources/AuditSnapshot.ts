import { KitsuResource } from "kitsu";

export interface AuditSnapshotAttributes {
  instanceId: string;
  state: Record<string, any>;
  changedProperties: string[];
  snapshotType: string;
  version: number;
  author: string;
  commitDateTime: string;
}

export type AuditSnapshot = KitsuResource & AuditSnapshotAttributes;

/** Shallow reference format provided by Javers. */
export type AuditToEntityReference = {
  typeName?: string;
  type?: string;
  id?: string;
  cdoId?: string;
};

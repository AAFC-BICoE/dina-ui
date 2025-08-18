import { KitsuResource, PersistedResource } from "kitsu";
import { baseRelationshipParser } from "../../baseRelationshipParser";
import { MolecularAnalysisRunItem } from "./molecular-analysis/MolecularAnalysisRunItem";

export interface QualityControlAttributes {
  type: "quality-control";
  group: string;
  name: string;
  qcType: string;
  createdOn?: string;
  createdBy?: string;
}

export interface QualityControlRelationships {
  molecularAnalysisRunItem?: MolecularAnalysisRunItem | null;
}

export type QualityControl = KitsuResource &
  QualityControlAttributes &
  QualityControlRelationships;

// Response types (what comes from API)
export interface QualityControlResponseAttributes {
  type: "quality-control";
  group: string;
  name: string;
  qcType: string;
  createdOn?: string;
  createdBy?: string;
}

export interface QualityControlResponseRelationships {
  molecularAnalysisRunItem?: {
    data?: PersistedResource<MolecularAnalysisRunItem>;
  };
}

export type QualityControlResponse = KitsuResource &
  QualityControlResponseAttributes &
  QualityControlResponseRelationships;

/**
 * Parses a `PersistedResource<QualityControlResponse>` object and transforms it into a `PersistedResource<QualityControl>`.
 *
 * This function omits specific relationship properties from the input quality control and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<QualityControlResponse>`.
 * @returns The parsed quality control resource, of type `PersistedResource<QualityControl>`.
 */
export function qualityControlParser(
  data: PersistedResource<QualityControlResponse>
): PersistedResource<QualityControl> {
  const parsedQualityControl = baseRelationshipParser(
    ["molecularAnalysisRunItem"],
    data
  ) as PersistedResource<QualityControl>;

  return parsedQualityControl;
}

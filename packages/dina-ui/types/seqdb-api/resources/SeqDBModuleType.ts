export const SEQDB_MODULE_TYPES = ["GENERIC_MOLECULAR_ANALYSIS"] as const;
export type SeqDBModuleType = (typeof SEQDB_MODULE_TYPES)[number];
export const SEQDB_MODULE_TYPE_LABELS: Record<SeqDBModuleType, string> = {
  GENERIC_MOLECULAR_ANALYSIS: "genericMolecularAnalysis"
};

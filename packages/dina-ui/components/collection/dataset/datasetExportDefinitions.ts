import { DatasetType } from "../../../types/collection-api";
import { ExportType } from "../../../types/dina-export-api";

export interface DatasetExportDefinition {
  exportType: ExportType;
  source: string;
  indexName: string;
}

export const DATASET_EXPORT_DEFINITIONS: Record<
  DatasetType,
  DatasetExportDefinition
> = {
  DWCA: {
    exportType: "DWCA",
    source: "dina_material_sample_index",
    indexName: "dina_material_sample_index"
  }
};

export function getDatasetExportDefinition(
  datasetType?: DatasetType
): DatasetExportDefinition {
  return DATASET_EXPORT_DEFINITIONS[datasetType ?? "DWCA"];
}

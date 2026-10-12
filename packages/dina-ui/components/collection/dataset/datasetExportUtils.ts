import { Dataset, DatasetAttributes } from "../../../types/collection-api";
import { DataExportDataset } from "../../../types/dina-export-api";

export function normalizeDatasetExportQuery(query: unknown): string {
  if (!query || typeof query !== "object" || !("query" in query)) {
    throw new Error("A search query is required for a dataset export.");
  }

  return JSON.stringify({ query: (query as { query: unknown }).query });
}

export function toDatasetExportSnapshot(dataset: Dataset): DataExportDataset {
  if (!dataset.id) {
    throw new Error("A saved dataset is required for a export.");
  }

  const attributes: Omit<
    DatasetAttributes,
    "type" | "createdOn" | "createdBy"
  > = {
    group: dataset.group,
    datasetVersion: dataset.datasetVersion,
    publicationDate: dataset.publicationDate,
    multilingualTitle: dataset.multilingualTitle,
    multilingualDescription: dataset.multilingualDescription,
    datasetType: dataset.datasetType,
    agentRoles: dataset.agentRoles,
    usageRights: dataset.usageRights,
    keywordSets: dataset.keywordSets,
    coverage: dataset.coverage,
    methods: dataset.methods,
    project: dataset.project
  };

  return Object.fromEntries(
    Object.entries({ uuid: dataset.id, ...attributes }).filter(
      ([, value]) => value !== undefined
    )
  ) as DataExportDataset;
}

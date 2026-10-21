import { Config, Utils } from "@react-awesome-query-builder/ui";
import {
  applyRootQuery,
  elasticSearchFormatExport
} from "common-ui/lib/list-page/query-builder/query-builder-elastic-search/QueryBuilderElasticSearchExport";
import { Dataset, DatasetAttributes } from "../../../types/collection-api";
import { DataExportDataset } from "../../../types/dina-export-api";

/**
 * Converts the dataset's stored query builder tree (JSON) into the Elasticsearch
 * query the export service expects. Returns undefined when the query is missing
 * or can't be converted.
 */
export function buildDatasetExportQuery(
  query?: string,
  config?: Config
): string | undefined {
  if (!query || !config) {
    return undefined;
  }
  try {
    const tree = Utils.loadTree(JSON.parse(query));
    const queryDSL = applyRootQuery(
      elasticSearchFormatExport(tree, config),
      undefined
    );
    return queryDSL?.query
      ? JSON.stringify({ query: queryDSL.query })
      : undefined;
  } catch {
    return undefined;
  }
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

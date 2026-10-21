import { CommonMessage, useApiClient } from "common-ui";
import { useQueryBuilderConfig } from "common-ui/lib/list-page/query-builder/useQueryBuilderConfig";
import { useMemo, useState } from "react";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { dynamicFieldMappingForMaterialSample } from "../../../pages/collection/material-sample/list";
import { Dataset } from "../../../types/collection-api";
import { DataExport } from "../../../types/dina-export-api";
import { getDatasetExportDefinition } from "./datasetExportDefinitions";
import {
  buildDatasetExportQuery,
  toDatasetExportSnapshot
} from "./datasetExportUtils";

interface DatasetExportButtonProps {
  dataset: Dataset;
}

/**
 * Requests an export of the viewed dataset using its saved query and export
 * name. The query is converted to the Elasticsearch format the export service
 * expects.
 */
export function DatasetExportButton({ dataset }: DatasetExportButtonProps) {
  const { save } = useApiClient();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [failed, setFailed] = useState(false);

  const definition = getDatasetExportDefinition(dataset.datasetType);
  const { queryBuilderConfig } = useQueryBuilderConfig({
    indexName: definition.indexName,
    dynamicFieldMapping: dynamicFieldMappingForMaterialSample
  });

  const exportQuery = useMemo(
    () => buildDatasetExportQuery(dataset.query, queryBuilderConfig),
    [dataset.query, queryBuilderConfig]
  );

  async function onExport() {
    if (!exportQuery || !dataset.exportName) {
      return;
    }

    setSubmitting(true);
    setFailed(false);
    try {
      const request: DataExport = {
        type: "data-export",
        name: dataset.exportName.trim(),
        exportType: definition.exportType,
        source: definition.source,
        query: exportQuery,
        dataset: toDatasetExportSnapshot(dataset)
      };

      await save<DataExport>([{ resource: request, type: "data-export" }], {
        apiBaseUrl: "/dina-export-api"
      });
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      setFailed(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-primary"
        onClick={onExport}
        disabled={submitting || !exportQuery || !dataset.exportName}
      >
        <DinaMessage id="datasetExportButtonText" />
      </button>
      {submitted && (
        <span role="status" className="align-self-center text-success">
          <DinaMessage id="datasetExportRequestSubmitted" />
        </span>
      )}
      {failed && (
        <span role="alert" className="align-self-center text-danger">
          <CommonMessage id="somethingWentWrong" />
        </span>
      )}
    </>
  );
}

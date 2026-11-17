import { CommonMessage, useApiClient } from "common-ui";
import { useQueryBuilderConfig } from "common-ui/lib/list-page/query-builder/useQueryBuilderConfig";
import { InputResource } from "kitsu";
import { useMemo, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { ExportPopup } from "../../export/ExportPopup";
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

  /** Called after a new version is saved, so the page can show it. */
  onVersionSaved?: (version: string) => void;
}

/**
 * Requests an export of the viewed dataset using its saved query and export
 * name. The query is converted to the Elasticsearch format the export service
 * expects.
 */
export function DatasetExportButton({
  dataset,
  onVersionSaved
}: DatasetExportButtonProps) {
  const { save } = useApiClient();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [failed, setFailed] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [version, setVersion] = useState(dataset.datasetVersion ?? "");

  const definition = getDatasetExportDefinition(dataset.datasetType);
  const { queryBuilderConfig } = useQueryBuilderConfig({
    indexName: definition.indexName,
    dynamicFieldMapping: dynamicFieldMappingForMaterialSample
  });

  const exportQuery = useMemo(
    () => buildDatasetExportQuery(dataset.query, queryBuilderConfig),
    [dataset.query, queryBuilderConfig]
  );

  function openVersionModal() {
    setVersion(dataset.datasetVersion ?? "");
    setShowVersionModal(true);
  }

  async function onExport() {
    if (!exportQuery || !dataset.exportName) {
      return;
    }

    setShowVersionModal(false);
    setSubmitting(true);
    setFailed(false);
    try {
      // Override the stored version when the user entered a different one:
      const newVersion = version.trim();
      let datasetToExport = dataset;
      if (newVersion && newVersion !== dataset.datasetVersion) {
        await save<Dataset>(
          [
            {
              resource: {
                id: dataset.id,
                type: "dataset",
                datasetVersion: newVersion
              } as InputResource<Dataset>,
              type: "dataset"
            }
          ],
          { apiBaseUrl: "/collection-api" }
        );
        datasetToExport = { ...dataset, datasetVersion: newVersion };
        onVersionSaved?.(newVersion);
      }

      const request: DataExport = {
        type: "data-export",
        name: dataset.exportName.trim(),
        exportType: definition.exportType,
        source: definition.source,
        query: exportQuery,
        dataset: toDatasetExportSnapshot(datasetToExport)
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
        ref={buttonRef}
        type="button"
        className="btn btn-primary"
        onClick={openVersionModal}
        disabled={submitting || !exportQuery || !dataset.exportName}
      >
        <DinaMessage id="datasetExportButtonText" />
      </button>
      <Modal show={showVersionModal} onHide={() => setShowVersionModal(false)}>
        <Modal.Header closeButton={true}>
          <Modal.Title>
            <DinaMessage id="datasetExportFormTitle" />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <DinaMessage id="datasetExportVersionPrompt" />
          </p>
          <label className="form-label" htmlFor="datasetExportVersion">
            <DinaMessage id="field_datasetVersion" />
          </label>
          <input
            id="datasetExportVersion"
            className="form-control"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => setShowVersionModal(false)}
          >
            <CommonMessage id="cancelButtonText" />
          </button>
          <button type="button" className="btn btn-primary" onClick={onExport}>
            <DinaMessage id="datasetExportButtonText" />
          </button>
        </Modal.Footer>
      </Modal>
      <ExportPopup
        target={buttonRef.current}
        show={submitted}
        onClose={() => setSubmitted(false)}
        placement="bottom"
      />
      {failed && (
        <span role="alert" className="align-self-center text-danger">
          <CommonMessage id="somethingWentWrong" />
        </span>
      )}
    </>
  );
}

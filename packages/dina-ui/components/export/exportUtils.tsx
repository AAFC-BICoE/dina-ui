import React from "react";
import { DataExport } from "packages/dina-ui/types/dina-export-api";
import { downloadDataExport } from "common-ui";
import Kitsu, { KitsuResource, PersistedResource } from "kitsu";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";

/**
 * Total number of objects allowed to be exported in the UI.
 *
 * This is applied to both the object-store export and the molecular analysis export.
 */
export const MAX_OBJECT_EXPORT_TOTAL = 100;

/**
 * The purpose of this limit is to prevent too many requests being performed on the molecular
 * analysis export.
 */
export const MAX_MATERIAL_SAMPLES_FOR_MOLECULAR_ANALYSIS_EXPORT = 200;

/**
 * How many retrys will be performed before failing the get export.
 */
const MAX_DATA_EXPORT_FETCH_RETRIES = 6;

/**
 * Base delay to be applied before trying again. Extra time is added on-top of this base for each
 * retry.
 */
const BASE_DELAY_EXPORT_FETCH_MS = 2000;

/**
 * Polls export status, downloads on complete, handles errors.
 *
 * Repeatedly checks export status using the export ID from `exportPostResponse`.
 * On `COMPLETED`, it downloads the export. On `ERROR` or timeout, it sets an error state.
 *
 * Manages loading state via `setLoading`.
 */
export async function getExport(
  exportPostResponse: PersistedResource<KitsuResource>[],
  setLoading: (loading: boolean) => void,
  setDataExportError: (error: React.ReactNode | undefined) => void,
  apiClient: Kitsu,
  formik?: any
) {
  let isFetchingDataExport = true;
  let fetchDataExportRetries = 0;
  let dataExportGetResponse;

  while (isFetchingDataExport) {
    if (fetchDataExportRetries <= MAX_DATA_EXPORT_FETCH_RETRIES) {
      if (dataExportGetResponse?.data?.status === "COMPLETED") {
        // Get the exported data
        await downloadDataExport(
          apiClient,
          exportPostResponse[0].id,
          formik?.values?.name
        );
        isFetchingDataExport = false;
      } else if (dataExportGetResponse?.data?.status === "ERROR") {
        isFetchingDataExport = false;
        setLoading(false);
        setDataExportError(
          <div className="alert alert-danger">
            <DinaMessage id="dataExportError" />
          </div>
        );
      } else {
        try {
          dataExportGetResponse = await apiClient.get<DataExport>(
            `dina-export-api/data-export/${exportPostResponse[0].id}`,
            {}
          );
        } catch (e) {
          if (e.cause.status === 404) {
            console.warn(e.cause);
          } else {
            throw e;
          }
        }

        // Exponential Backoff
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            BASE_DELAY_EXPORT_FETCH_MS * 2 ** fetchDataExportRetries
          )
        );
        fetchDataExportRetries += 1;
      }
    } else {
      // Max retries reached
      isFetchingDataExport = false;
      setLoading(false);
      setDataExportError(
        <div className="alert alert-danger">
          <DinaMessage id="dataExportError" />
        </div>
      );
    }
  }
  isFetchingDataExport = false;
}

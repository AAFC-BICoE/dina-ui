import React from "react";
import { DataExport } from "packages/dina-ui/types/dina-export-api";
import { downloadDataExport } from "common-ui";
import Kitsu, { KitsuResource, PersistedResource } from "kitsu";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";

const MAX_DATA_EXPORT_FETCH_RETRIES = 6;
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

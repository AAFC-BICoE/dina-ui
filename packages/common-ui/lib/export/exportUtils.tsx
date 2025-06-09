import Kitsu, { PersistedResource } from "kitsu";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { DataExport } from "../../../dina-ui/types/dina-export-api";
import { ObjectExport } from "../../../dina-ui/types/objectstore-api";
import { ReactNode } from "react";

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
  exportPostResponse: PersistedResource<DataExport | ObjectExport>[],
  setLoading: (loading: boolean) => void,
  setDataExportError: (error: ReactNode | undefined) => void,
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
          exportPostResponse[0],
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

/**
 * Downloads an exported data file from the server and initiates a download in the browser.
 *
 * @param {Kitsu} apiClient - An instance of the API client used to make the request.
 * @param {DataExport} exportToDownload - The data export object containing information about the export.
 * @param {string} exportName - The name to be used for the downloaded file.
 *
 * @returns {Promise<void>} - A promise that resolves when the download is initiated.
 *
 */
export async function downloadDataExport(
  apiClient: Kitsu,
  exportToDownload: DataExport | ObjectExport,
  exportName?: string
): Promise<void> {
  if (exportToDownload?.id) {
    const getFileResponse = await apiClient.get(
      `dina-export-api/file/${exportToDownload.id}?type=DATA_EXPORT`,
      {
        responseType: "blob",
        timeout: 0
      }
    );

    // Generate the file name and file extension.
    let fileName: string;
    let fileExtension: string;
    if (exportToDownload.type === "data-export") {
      fileName = exportName ?? exportToDownload?.name ?? exportToDownload.id;
      if (exportToDownload.exportType === "OBJECT_ARCHIVE") {
        fileExtension = ".zip";
      } else {
        fileExtension =
          exportToDownload?.exportOptions?.columnSeparator === "COMMA"
            ? ".csv"
            : ".tsv";
      }
    } else {
      fileName = exportName ?? exportToDownload?.id;
      fileExtension = "";
    }

    // Download the data
    downloadBlobFile(getFileResponse as any, `${fileName}${fileExtension}`);
  }
}

/**
 * Downloads a file from a Blob response.
 *
 * @param {Blob} blob - The blob data to be downloaded.
 * @param {string} fileName - The name of the file to be downloaded, extension should be appended to it. (e.g "file.csv")
 */
export function downloadBlobFile(blob: any, fileName: string): void {
  const url = window?.URL.createObjectURL(blob);
  const link = document?.createElement("a");
  link.href = url ?? "";
  link?.setAttribute("download", fileName);
  document?.body?.appendChild(link);
  link?.click();
  document?.body?.removeChild(link);
  if (typeof window !== "undefined" && window?.URL?.revokeObjectURL) {
    window?.URL?.revokeObjectURL(url ?? "");
  }
}

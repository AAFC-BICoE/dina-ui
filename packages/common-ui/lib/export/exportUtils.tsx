import Kitsu from "kitsu";
import { DataExport } from "@dina-ui/types/dina-export-api";
import { ObjectExport } from "@dina-ui/types/objectstore-api";

/**
 * Total number of objects allowed to be exported in the UI.
 *
 * This is applied to both the object-store export and the molecular analysis export.
 */
export const MAX_OBJECT_EXPORT_TOTAL = 1000;

/**
 * The purpose of this limit is to prevent too many requests being performed on the molecular
 * analysis export.
 */
export const MAX_MATERIAL_SAMPLES_FOR_MOLECULAR_ANALYSIS_EXPORT = 700;

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
    const baseFileName = fileName.replace(/\.[^/.]+$/, "");
    downloadBlobFile(getFileResponse as any, `${baseFileName}${fileExtension}`);
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

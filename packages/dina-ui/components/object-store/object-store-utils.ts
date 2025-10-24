import Kitsu from "kitsu";
import { downloadBlobFile } from "common-ui";
import { Dispatch, SetStateAction } from "react";
import _ from "lodash";

export const RAW_EXTS = new Set([".cr2", ".nef"]); // Raw file extensions that cannot be viewed directly

/**
 * Util function to fetch file object as blob ready to be downloaded
 *
 * @param path The download link.
 * @param apiClient Dina UI's apiClient from useApiClient
 */
export async function fetchObjectBlob(path: string, apiClient: Kitsu) {
  return await apiClient.axios.get(path, {
    responseType: "blob",
    timeout: 0
  });
}

/**
 * When the user clicks a download link, the current token will be appended.
 *
 * @param path The download link.
 * @param apiClient Dina UI's apiClient from useApiClient
 * @param setIsDownloading Callback state setter
 */
export async function handleDownloadLink(
  path: string,
  apiClient: Kitsu,
  setIsDownloading: Dispatch<SetStateAction<boolean>>
) {
  if (path) {
    try {
      setIsDownloading(true);
      const response = await fetchObjectBlob(path, apiClient);
      const content: string = response.headers["content-disposition"];
      const filename = content
        .slice(content.indexOf("filename=") + "filename=".length)
        .replaceAll('"', "");

      downloadBlobFile(response.data, filename);

      setIsDownloading(false);
    } catch (error) {
      setIsDownloading(false);
      return error;
    }
  }
}

export function formatBytes(bytes, decimals: number = 2): string {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function derivativeTypeToLabel(
  derivativeType: string,
  messages: any
): string {
  switch (derivativeType) {
    case "THUMBNAIL_IMAGE":
      return messages?.["THUMBNAIL_IMAGE"] || "Thumbnail";
    case "LARGE_IMAGE":
      return messages?.["LARGE_IMAGE"] || "Large Image";
    case "CROPPED_IMAGE":
      return messages?.["CROPPED_IMAGE"] || "Cropped Image";
    default:
      // Display it as a human-readable string, should be using a translation key though.
      return _.startCase(derivativeType.replace(/_/g, " "));
  }
}

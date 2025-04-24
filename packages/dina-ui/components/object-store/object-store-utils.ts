import Kitsu from "kitsu";
import { downloadBlobFile } from "common-ui";
import { Dispatch, SetStateAction } from "react";

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

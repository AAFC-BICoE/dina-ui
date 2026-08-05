import { IFileWithMeta, useApiClient } from "common-ui";
import { Dispatch, SetStateAction, useState } from "react";

export interface WorkbookConversionResult {
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  failed: boolean;
  error?: any;
  convertWorkbookFile: (
    acceptedFiles: IFileWithMeta[]
  ) => Promise<any | undefined>;
  resetWorkbookConversion: () => void;
}

export function useWorkbookConversion(): WorkbookConversionResult {
  const { apiClient } = useApiClient();

  const [loading, setLoading] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);
  const [error, setError] = useState<any>();

  async function convertWorkbookFile(
    acceptedFiles: IFileWithMeta[]
  ): Promise<any | undefined> {
    setLoading(true);
    setFailed(false);
    setError(undefined);

    const formData = new FormData();
    formData.append("file", acceptedFiles[0].file);

    try {
      const response = await apiClient.axios.post(
        "/objectstore-api/workbook/conversion",
        formData
      );
      setLoading(false);
      return response.data;
    } catch (caughtError) {
      setLoading(false);
      setFailed(true);
      setError(caughtError);
      return undefined;
    }
  }

  function resetWorkbookConversion() {
    setLoading(false);
    setFailed(false);
    setError(undefined);
  }

  return {
    loading,
    setLoading,
    failed,
    error,
    convertWorkbookFile,
    resetWorkbookConversion
  };
}

import { ApiClientContext } from "common-ui";
import { useDinaIntl } from "../../../../dina-ui/intl/dina-ui-intl";
import { createContext, useContext } from "react";
import { ObjectUpload } from "../../../types/objectstore-api/resources/ObjectUpload";
import { IFileWithMeta } from "./FileUploader";

export interface FileUploadContextI {
  uploadFiles: (params: UploadFileParams) => Promise<ObjectUpload[]>;
}

export interface UploadFileParams {
  files: IFileWithMeta[];
  group: string;
  isDerivative?: boolean;
  isReportTemplate?: boolean;
}

const FileUploadContext = createContext<FileUploadContextI | null>(null);

/** Exposes the needed features from the identity provider. */
export function useFileUpload(): FileUploadContextI {
  const ctx = useContext(FileUploadContext);
  if (!ctx) {
    throw new Error("No FileUploadContext available.");
  }
  return ctx;
}

export const FileUploadProvider = FileUploadContext.Provider;

export function FileUploadProviderImpl({ children }) {
  const { apiClient } = useContext(ApiClientContext);
  const { formatMessage } = useDinaIntl();

  async function uploadFiles({
    files,
    group,
    isDerivative,
    isReportTemplate
  }: UploadFileParams) {
    const uploadRespsT: ObjectUpload[] = [];
    for (const { file } of files) {
      // Wrap the file in a FormData:
      const formData = new FormData();

      if (isReportTemplate) {
        const blob = file?.slice(0, file?.size, "text/x-freemarker-template");
        formData.append("file", blob, file?.name);
      } else {
        formData.append("file", file);
      }

      // Upload the file:
      const response = await apiClient.axios.post(
        isDerivative
          ? `/objectstore-api/file/${group}/derivative`
          : `/objectstore-api/file/${group}`,
        formData,
        {
          transformResponse: (data) =>
            fileUploadErrorHandler(data, file, formatMessage),
          timeout: 0
        }
      );

      uploadRespsT.push({
        id: response?.data?.data?.id,
        type: response?.data?.data?.type,
        meta: response?.data?.data?.meta,
        ...response?.data?.data?.attributes
      });
    }

    return uploadRespsT;
  }

  return (
    <FileUploadProvider value={{ uploadFiles }}>{children}</FileUploadProvider>
  );
}

/** Errors are handled differently here because they come from Spring Boot instead of Crnk. */
export function fileUploadErrorHandler(
  data: string,
  file: File,
  formatMessage
) {
  // Custom spring boot error handling to get the correct error message:
  let parsedData;

  try {
    parsedData = JSON.parse(data);
  } catch {
    // Check if the error is a Unsupported Media Type error.
    if (data.includes("Unsupported Media Type")) {
      throw new Error(
        formatMessage("unsupportedFileTypeError", { fileName: file.name })
      );
    } else if (data.includes("HTTP Status 403")) {
      throw new Error(formatMessage("http403ForbiddenError"));
    } else if (data.includes("HTTP Status 500")) {
      throw new Error(formatMessage("http500InternalServerError"));
    }

    // Otherwise, just display the error message.
    throw new Error(data);
  }

  const errorDetail = parsedData?.errors?.[0]?.detail;
  if (errorDetail) {
    throw new Error(errorDetail);
  }

  // If no error, proceed as usual:
  return parsedData;
}

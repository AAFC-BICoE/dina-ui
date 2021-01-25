import { ApiClientContext } from "common-ui";
import { createContext, useContext } from "react";
import { ObjectUpload } from "../../../types/objectstore-api/resources/ObjectUpload";
import { IFileWithMeta } from "./FileUploader";

export interface FileUploadContextI {
  uploadFiles: (params: UploadFileParams) => Promise<ObjectUpload[]>;
}

export interface UploadFileParams {
  files: IFileWithMeta[];
  group: string;
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

  async function uploadFiles({ files, group }: UploadFileParams) {
    const uploadRespsT: ObjectUpload[] = [];
    for (const { file } of files) {
      // Wrap the file in a FormData:
      const formData = new FormData();
      formData.append("file", file);

      // Upload the file:
      const response = await apiClient.axios.post(
        `/objectstore-api/file/${group}`,
        formData,
        { transformResponse: fileUploadErrorHandler }
      );
      uploadRespsT.push(response.data);
    }

    return uploadRespsT;
  }

  return (
    <FileUploadProvider value={{ uploadFiles }}>{children}</FileUploadProvider>
  );
}

/** Errors are handled differently here because they come from Spring Boot instead of Crnk. */
export function fileUploadErrorHandler(data: string) {
  // Custom spring boot error handling to get the correct error message:
  const parsed = JSON.parse(data);
  const errorDetail = parsed?.errors?.[0]?.detail;
  if (errorDetail) {
    throw new Error(errorDetail);
  }

  // If no error, proceed as usual:
  return parsed;
}

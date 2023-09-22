import { parse as parseBytesString } from "bytes";
import {
  LoadingSpinner,
  OnFormikSubmit,
  safeSubmit,
  useQuery,
  withResponse
} from "common-ui";
import { useFormikContext } from "formik";
import { KitsuResource } from "kitsu";
import { useLayoutEffect, useRef } from "react";
import Dropzone, {
  Preview,
  SubmitButton
} from "react-dropzone-uploader/dist/react-dropzone-uploader";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

/** FileUploader component props. */
export interface FileUploaderProps<TValues = any> {
  onSubmit: OnFormikSubmit<FileUploaderOnSubmitArgs<TValues>>;
}

interface IDropzoneCommonProps {
  files: IFileWithMeta[];
}

interface IDropzoneSubmitButtonProps extends IDropzoneCommonProps {
  className?: string;
  buttonClassName?: string;
  style?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
  disabled: boolean;
  content?: React.ReactNode;
  onSubmit: (files: IFileWithMeta[]) => void;
}

/** The args passed into the onSubmit prop. */
export type FileUploaderOnSubmitArgs<TValues = {}> = TValues & {
  acceptedFiles: IFileWithMeta[];
};

export interface IFileWithMeta {
  file: File;
  meta: IMeta;
  cancel: () => void;
  restart: () => void;
  remove: () => void;
}

export interface IMeta {
  type: string; // MIME type, example: `image/*`
  name: string;
  size: number; // bytes
  lastModifiedDate: string; // ISO string
}

export interface FileUploadApiConfig extends KitsuResource {
  "max-file-size": string;
  "max-request-size": string;
}

/**
 * File Uploader component.
 * Use this component's onSubmit prop instead of the parent Formik's onSubmit prop.
 */
export function FileUploader<TValues = any>({
  onSubmit
}: FileUploaderProps<TValues>) {
  const { formatMessage } = useDinaIntl();
  const formik = useFormikContext<TValues>();

  // Get the file upload config from the API:
  const fileUploadConfigQuery = useQuery<FileUploadApiConfig>({
    path: "objectstore-api/config/file-upload"
  });

  return withResponse(fileUploadConfigQuery, ({ data: fileUploadConfig }) => {
    // The API uses a human-readable bytes string e.g. "2GB".
    // Parse it to the equivalent bytes number e.g. 2147483648 for the Dropzone component.
    const humanReadableBytesString = fileUploadConfig["max-file-size"];
    const maxSizeBytes =
      parseBytesString(humanReadableBytesString) || undefined;

    return (
      <div>
        {maxSizeBytes && (
          <DinaMessage
            id="uploadFilesMaxSize"
            values={{ maxSize: humanReadableBytesString }}
          />
        )}
        <Dropzone
          maxSizeBytes={maxSizeBytes}
          onSubmit={(acceptedFiles) =>
            safeSubmit(onSubmit)({ ...formik.values, acceptedFiles }, formik)
          }
          PreviewComponent={CustomPreviewComponent}
          SubmitButtonComponent={(props: IDropzoneSubmitButtonProps) => {
            const filesWithMeta = props.files;
            const hasAnInvalidFileSize =
              maxSizeBytes &&
              filesWithMeta.filter((file) => file.file.size > maxSizeBytes)
                .length
                ? true
                : false;

            const submitDisabled = props.disabled || hasAnInvalidFileSize;

            return formik.isSubmitting ? (
              <LoadingSpinner loading={true} />
            ) : (
              <SubmitButton {...props} disabled={submitDisabled} />
            );
          }}
          styles={{
            dropzone: { overflow: "initial" },
            inputLabel: { padding: "1.25rem", color: "#333333" },
            preview: { zIndex: "auto" }
          }}
          inputContent={formatMessage("uploadFormInstructions")}
          inputWithFilesContent={formatMessage("addFilesButton")}
          submitButtonContent={formatMessage("submitBtnText")}
          classNames={{
            submitButton: "btn btn-success",
            inputLabelWithFiles: "btn btn-default dzu-inputLabelAddFiles"
          }}
        />
      </div>
    );
  });
}

/**
 * Since the default Preview component shows only the thumbnail for image files,
 * customize it to also show the filename.
 */
function CustomPreviewComponent(props) {
  const ref = useRef<HTMLDivElement>(null);
  const { formatMessage } = useDinaIntl();

  // Add improvements to the per-file preview component:
  useLayoutEffect(() => {
    const img = ref.current?.querySelector("img.dzu-previewImage");
    if (img) {
      // Show the filename to the right of the image:
      const filenameNode = ref.current?.querySelector(".dzu-previewFileName");
      if (!filenameNode) {
        const newFilenameNode = document.createElement("span");
        newFilenameNode.className = "dzu-previewFileName mx-3";
        newFilenameNode.innerText = props.fileWithMeta.file.name;
        img?.after(newFilenameNode);
      }
    }

    const childSpans = ref.current?.querySelectorAll("span");
    if (childSpans) {
      for (const span of childSpans) {
        // Replace the library's hard-coded file size error with our intl version:
        if (span.innerText === "File too big") {
          span.innerText = formatMessage("fileTooBig");
        }
      }
    }
  });

  return (
    <div ref={ref} className="w-100">
      <style>{`
        /* Move the preview to the left, and the status container to the right: */
        .dzu-previewStatusContainer {
          margin-left: auto !important;
        }

        /* Make the image non-draggable: */
        img.dzu-previewImage {
          user-drag: none; 
          user-select: none;
          -moz-user-select: none;
          -webkit-user-drag: none;
          -webkit-user-select: none;
          -ms-user-select: none;
        }
      `}</style>
      <Preview {...props} />
    </div>
  );
}

import { LoadingSpinner, OnFormikSubmit, safeSubmit } from "common-ui";
import { useFormikContext } from "formik";
import { useLayoutEffect, useRef } from "react";
import Dropzone, {
  Preview,
  SubmitButton
} from "react-dropzone-uploader/dist/react-dropzone-uploader";
import { useDinaIntl } from "../../intl/dina-ui-intl";

/** FileUploader component props. */
export interface FileUploaderProps<TValues = any> {
  acceptedFileTypes: string;
  onSubmit: OnFormikSubmit<FileUploaderOnSubmitArgs<TValues>>;
}

/** The args passed into the onSubmit prop. */
export type FileUploaderOnSubmitArgs<TValues> = TValues & {
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

/**
 * File Uploader component.
 * Use this component's onSubmit prop instead of the parent Formik's onSubmit prop.
 */
export function FileUploader<TValues = any>({
  acceptedFileTypes,
  onSubmit
}: FileUploaderProps<TValues>) {
  const { formatMessage } = useDinaIntl();
  const formik = useFormikContext<TValues>();

  return (
    <Dropzone
      accept={acceptedFileTypes}
      onSubmit={acceptedFiles =>
        safeSubmit(onSubmit)({ ...formik.values, acceptedFiles }, formik)
      }
      PreviewComponent={CustomPreviewComponent}
      SubmitButtonComponent={props =>
        formik.isSubmitting ? (
          <LoadingSpinner loading={true} />
        ) : (
          <SubmitButton {...props} />
        )
      }
      styles={{
        dropzone: { overflow: "initial" },
        inputLabel: { padding: "1.25rem" }
      }}
      inputContent={formatMessage("uploadFormInstructions")}
      inputWithFilesContent={formatMessage("addFilesButton")}
      submitButtonContent={formatMessage("submitBtnText")}
    />
  );
}

/**
 * Since the default Preview component shows only the thumbnail for image files,
 * customize it to also show the filename.
 */
function CustomPreviewComponent(props) {
  const ref = useRef<HTMLDivElement>(null);

  // Fix the layout for
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

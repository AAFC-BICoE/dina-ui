import { parse as parseBytesString } from "bytes";
import {
  DefaultSubmitButton,
  FileDropzone,
  IFileWithMeta,
  LoadingSpinner,
  OnFormikSubmit,
  safeSubmit,
  SubmitButtonProps,
  useQuery,
  withResponse
} from "common-ui";
import { useFormikContext } from "formik";
import { KitsuResource } from "kitsu";
import { useDinaIntl } from "../../../intl/dina-ui-intl";

export interface FileUploadApiConfig extends KitsuResource {
  "max-file-size": string;
  "max-request-size": string;
}

/** The args passed into the onSubmit prop. */
export type FileUploaderOnSubmitArgs<TValues = {}> = TValues & {
  acceptedFiles: IFileWithMeta[];
  submitType: "workbook" | "batchEntry";
};

/** FileUploader component props. */
export interface FileUploaderProps<TValues = any> {
  onSubmit: OnFormikSubmit<FileUploaderOnSubmitArgs<TValues>>;

  /**
   * Optional custom submit button component.
   */
  SubmitButtonComponent?: React.ComponentType<
    SubmitButtonProps & {
      isSubmitting: boolean;
      hasAnInvalidFileSize: boolean;
      maxSizeBytes?: number;
    }
  >;
}

/**
 * File Uploader component.
 * Use this component's onSubmit prop instead of the parent Formik's onSubmit prop.
 */
export function FileUploader<TValues = any>({
  onSubmit,
  SubmitButtonComponent: CustomSubmitButtonComponent
}: FileUploaderProps<TValues>) {
  const { formatMessage } = useDinaIntl();
  const formik = useFormikContext<TValues>();

  const fileUploadConfigQuery = useQuery<FileUploadApiConfig>({
    path: "objectstore-api/config/file-upload"
  });

  return withResponse(fileUploadConfigQuery, ({ data: fileUploadConfig }) => {
    const humanReadableBytesString = fileUploadConfig["max-file-size"];
    const maxSizeBytes =
      parseBytesString(humanReadableBytesString) || undefined;

    return (
      <FileDropzone
        maxSizeBytes={maxSizeBytes}
        onSubmit={(acceptedFiles) =>
          safeSubmit(onSubmit)(
            {
              ...formik.values,
              acceptedFiles,
              submitType: (formik.values as any).submitType
            },
            formik
          )
        }
        inputContent={formatMessage("uploadFormInstructions")}
        inputWithFilesContent={formatMessage("addFilesButton")}
        submitButtonContent={formatMessage("submitBtnText")}
        SubmitButtonComponent={(props: SubmitButtonProps) => {
          const hasAnInvalidFileSize =
            !!maxSizeBytes &&
            props.files.some((file) => file.file.size > maxSizeBytes);
          const submitDisabled = props.disabled || hasAnInvalidFileSize;

          if (CustomSubmitButtonComponent) {
            return (
              <CustomSubmitButtonComponent
                {...props}
                disabled={submitDisabled}
                isSubmitting={formik.isSubmitting}
                hasAnInvalidFileSize={hasAnInvalidFileSize}
                maxSizeBytes={maxSizeBytes}
              />
            );
          }

          return formik.isSubmitting ? (
            <LoadingSpinner loading={true} />
          ) : (
            <DefaultSubmitButton
              {...props}
              disabled={submitDisabled}
              content={formatMessage("submitBtnText")}
            />
          );
        }}
      />
    );
  });
}

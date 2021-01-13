import { ErrorViewer, SelectField, useGroupSelectOptions } from "common-ui";
import { Form, Formik } from "formik";
import { noop } from "lodash";
import { FileUploader, FileUploaderOnSubmitArgs } from "..";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { useFileUpload } from "../file-upload/FileUploadProvider";
import { useBulkMetadataEditModal } from "./useBulkMetadataEditModal";

export interface AttachmentUploadForm {
  group?: string;
}

export interface AttachmentUploaderProps {
  afterMetadatasSaved: (metadataIds: string[]) => Promise<void>;
}

export function AttachmentUploader({
  afterMetadatasSaved
}: AttachmentUploaderProps) {
  const { formatMessage } = useDinaIntl();
  const { uploadFiles } = useFileUpload();
  const groupSelectOptions = useGroupSelectOptions();
  const { openMetadataEditorModal } = useBulkMetadataEditModal();

  const acceptedFileTypes = "image/*,audio/*,video/*,.pdf,.doc,.docx,.png";

  async function onUploaderSubmit({
    acceptedFiles,
    group
  }: FileUploaderOnSubmitArgs<AttachmentUploadForm>) {
    if (!group) {
      throw new Error(formatMessage("groupMustBeSelected"));
    }

    const objectUploads = await uploadFiles({ files: acceptedFiles, group });

    const objectUploadIds = objectUploads.map(
      ({ fileIdentifier }) => fileIdentifier
    );

    openMetadataEditorModal({
      afterMetadatasSaved,
      group,
      objectUploadIds
    });
  }

  return (
    <Formik<AttachmentUploadForm> initialValues={{}} onSubmit={noop}>
      <Form>
        <ErrorViewer />
        <div className="row">
          <SelectField
            className="col-md-3"
            name="group"
            options={groupSelectOptions}
          />
        </div>
        <div>
          <FileUploader
            onSubmit={onUploaderSubmit}
            acceptedFileTypes={acceptedFileTypes}
          />
        </div>
      </Form>
    </Formik>
  );
}

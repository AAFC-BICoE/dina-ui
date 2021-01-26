import { DinaForm } from "common-ui";
import { FileUploader, FileUploaderOnSubmitArgs } from "..";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { GroupSelectField } from "../../group-select/GroupSelectField";
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
    <DinaForm<AttachmentUploadForm> initialValues={{}}>
      <div className="row">
        <GroupSelectField className="col-md-3" name="group" />
      </div>
      <div>
        <FileUploader
          onSubmit={onUploaderSubmit}
          acceptedFileTypes={acceptedFileTypes}
        />
      </div>
    </DinaForm>
  );
}

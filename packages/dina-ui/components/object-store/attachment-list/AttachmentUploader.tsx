import {
  ErrorViewer,
  SelectField,
  useGroupSelectOptions,
  useModal
} from "common-ui";
import { Form, Formik } from "formik";
import { noop } from "lodash";
import { FileUploader, FileUploaderOnSubmitArgs } from "..";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { useFileUpload } from "../file-upload/FileUploadProvider";
import { BulkMetadataEditor } from "../metadata-bulk-editor/BulkMetadataEditor";

export interface AttachmentUploadForm {
  group?: string;
}

export interface AttachmentUploaderProps {
  afterMetadatasSaved: (metadataIds: string[]) => Promise<void>;
}

export function AttachmentUploader({
  afterMetadatasSaved: afterMetadatasSavedProp
}: AttachmentUploaderProps) {
  const { formatMessage } = useDinaIntl();
  const { uploadFiles } = useFileUpload();
  const groupSelectOptions = useGroupSelectOptions();
  const { openModal, closeModal } = useModal();

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

    async function afterMetadatasSavedInternal(metadataIds: string[]) {
      await afterMetadatasSavedProp(metadataIds);
      closeModal();
    }

    openModal(
      <div className="modal-content">
        <style>{`
          .modal-dialog {
            max-width: calc(100vw - 3rem) !important;
            height: calc(100vh - 3rem) !important;
          }
          .ht_master .wtHolder {
            height: 0% !important;
          }
        `}</style>
        <div className="modal-header">
          <button className="btn btn-dark" onClick={closeModal}>
            <DinaMessage id="cancelButtonText" />
          </button>
        </div>
        <div className="modal-body">
          <BulkMetadataEditor
            objectUploadIds={objectUploadIds}
            group={group}
            afterMetadatasSaved={afterMetadatasSavedInternal}
          />
        </div>
      </div>
    );
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

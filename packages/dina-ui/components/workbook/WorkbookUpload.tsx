import { IFileWithMeta } from "../object-store/file-upload/FileUploader";
import { DinaMessage } from "../../intl/dina-ui-intl";
import Dropzone from "react-dropzone-uploader/dist/react-dropzone-uploader";

interface WorkbookUploadProps {
  submitData: (acceptedFiles: IFileWithMeta[]) => void;
}

export function WorkbookUpload({ submitData }: WorkbookUploadProps) {
  return (
    <form>
      <Dropzone
        onSubmit={submitData}
        multiple={false}
        maxFiles={1}
        accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        classNames={{
          submitButton: "btn btn-success",
          inputLabelWithFiles: "btn btn-default dzu-inputLabelAddFiles",
          submitButtonContainer: "dzu-submitContainer"
        }}
        styles={{
          dropzone: { overflow: "initial" },
          inputLabel: { padding: "1.25rem", color: "#333333" },
          submitButtonContainer: {
            margin: "1em 2em 1em 0em",
            alignSelf: "flex-end"
          }
        }}
        inputContent={<DinaMessage id="workbookUploadInstructions" />}
      />
    </form>
  );
}

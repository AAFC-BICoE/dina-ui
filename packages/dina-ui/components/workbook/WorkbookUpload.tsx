import { IFileWithMeta } from "@dina-ui/components/object-store";
import { DinaMessage } from "@dina-ui/intl/dina-ui-intl";
import { FileDropzone } from "common-ui";

interface WorkbookUploadProps {
  submitData: (acceptedFiles: IFileWithMeta[]) => void;
}

export function WorkbookUpload({ submitData }: WorkbookUploadProps) {
  return (
    <form>
      <FileDropzone
        onSubmit={submitData}
        maxFiles={1}
        accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
        inputContent={<DinaMessage id="workbookUploadInstructions" />}
      />
    </form>
  );
}

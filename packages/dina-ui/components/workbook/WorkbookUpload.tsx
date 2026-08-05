import { DinaMessage } from "@dina-ui/intl/dina-ui-intl";
import { FileDropzone, IFileWithMeta } from "common-ui";

interface WorkbookUploadProps {
  submitData: (acceptedFiles: IFileWithMeta[]) => void;
  autoUpload?: boolean;
  onClear?: () => void;
}

export function WorkbookUpload({
  submitData,
  autoUpload = false,
  onClear
}: WorkbookUploadProps) {
  return (
    <form>
      <FileDropzone
        onSubmit={submitData}
        onClear={onClear}
        maxFiles={1}
        accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
        inputContent={<DinaMessage id="workbookUploadInstructions" />}
        autoUpload={autoUpload}
      />
    </form>
  );
}

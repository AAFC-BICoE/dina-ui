import { Component } from "react";
import { IFileWithMeta } from "../object-store/file-upload/FileUploader";
import Dropzone from "react-dropzone-uploader";

interface WorkbookUploadProps {
  submitData: (acceptedFiles?: IFileWithMeta[]) => {};
}

export class WorkbookUpload extends Component<WorkbookUploadProps> {
  render() {
    return (
      <form>
        <Dropzone
          onSubmit={this.props.submitData}
          multiple={false}
          maxFiles={1}
          accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        />
      </form>
    );
  }
}

export default WorkbookUpload;

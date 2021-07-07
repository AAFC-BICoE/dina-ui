import { Component } from "react";
import Dropzone from "react-dropzone-uploader";

interface WorkbookUploadProps {
  submitData: (acceptedFile) => void;
}

export class WorkbookUpload extends Component<WorkbookUploadProps> {
  render() {
    return (
      <form>
        <Dropzone
          onSubmit={this.props.submitData}
          autoUpload={true}
          multiple={false}
          maxFiles={1}
          accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        />
      </form>
    );
  }
}

export default WorkbookUpload;

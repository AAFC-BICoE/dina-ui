import React from "react";
import Dropzone from "react-dropzone-uploader";
import { DinaForm } from "common-ui";

type WorkbookUploaderProps = { onSubmit };
type WorkbookUploaderStates = { tableData: string; loading: boolean };

export class WorkbookUploader extends React.Component<
  WorkbookUploaderProps,
  WorkbookUploaderStates
> {
  constructor(props) {
    super(props);
    this.state = { tableData: "", loading: false };
  }

  render() {
    return (
      <DinaForm initialValues={{ defaultValuesConfig: null }}>
        <main role="main">
          <div className="container">
            <Dropzone
              onSubmit={this.props.onSubmit}
              multiple={false}
              maxFiles={1}
              accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            />
          </div>
        </main>
      </DinaForm>
    );
  }
}

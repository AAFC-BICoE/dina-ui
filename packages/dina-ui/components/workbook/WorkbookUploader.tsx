import React from "react";
import Dropzone from "react-dropzone-uploader";
import { DinaForm } from "common-ui";
import { ApiClientContext } from "common-ui";
import { useContext } from "react";

export class WorkbookUploader extends React.Component {
  constructor(props) {
    super(props);
    this.state = { tableData: null, onSubmit: {} };
  }

  onSubmit(acceptedFile) {
    const { apiClient } = useContext(ApiClientContext);

    const formData = new FormData();
    formData.append("file", acceptedFile[0].file);

    // Retrieve the JSON to display on the workbook page.
    const response = apiClient.axios.post(
      "/objectstore-api/conversion/workbook",
      formData
    );

    this.setState({ tableData: response });
  }

  render() {
    return (
      <DinaForm initialValues={{ defaultValuesConfig: null }}>
        <main role="main">
          <div className="container">
            <Dropzone
              onSubmit={this.onSubmit}
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

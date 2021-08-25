import React, { Component } from "react";
import { LoadingSpinner } from "common-ui";
import { IFileWithMeta } from "../object-store/file-upload/FileUploader";
import { DinaMessage } from "../../intl/dina-ui-intl";
import Kitsu from "kitsu";
import WorkbookDisplay from "./WorkbookDisplay";
import WorkbookUpload from "./WorkbookUpload";

interface WorkbookProps {
  apiClient: Kitsu;
}

interface WorkbookStates {
  jsonData: WorkbookJSON | null;
  loading: boolean;
  failed: boolean;
}

/**
 * Data returned from the Excel to JSON API from the object store module API.
 */
export interface WorkbookRow {
  id: number;
  rowNumber: number;
  content: string[];
}

/**
 * JSON workbook contains an array of rows, defined as a Workbook Row.
 */
export interface WorkbookJSON extends Array<WorkbookRow> {}

/**
 * The parent component used for the workbook conversion task.
 */
export class WorkbookConversion extends Component<
  WorkbookProps,
  WorkbookStates
> {
  constructor(props: WorkbookProps) {
    super(props);

    this.state = {
      loading: false,
      jsonData: null,
      failed: false
    };
  }

  /**
   * Method used to take an excel file and pass it to the API that converts it to the JSON.
   *
   * The JSON data is populated as a state.
   *
   * @param acceptedFile IMetadata file.
   */
  submitFile = async (acceptedFiles: IFileWithMeta[]) => {
    const { apiClient } = this.props;
    const formData = new FormData();
    formData.append("file", acceptedFiles[0].file);

    // Display the loading spinner, and reset any error messages.
    this.setState({ loading: true });

    // Attempt to call the conversion API.
    await apiClient.axios
      .post("/objectstore-api/conversion/workbook", formData)
      .then(response => {
        this.setState({
          jsonData: response.data,
          loading: false,
          failed: false
        });
      })
      .catch(() => {
        this.setState({
          jsonData: null,
          loading: false,
          failed: true
        });
      });
  };

  /**
   * Back button functionality will reset the state to display the upload component.
   */
  backToUpload = () => {
    this.setState({
      loading: false,
      jsonData: null
    });
  };

  render() {
    // Deconstruct the states.
    const { loading, jsonData, failed } = this.state;
    const failedMessage = failed ? (
      <div className="alert alert-danger">
        <DinaMessage id="workbookUploadFailure" />
      </div>
    ) : undefined;

    // Determine which component should be rendered based on the states.
    if (loading) {
      // Display the loading spinner.
      return <LoadingSpinner loading={true} />;
    } else {
      // If failed display the error message.

      // If the json data is provided, display the JSON as a table. Otherwise display the uploading component.
      if (jsonData) {
        return (
          <WorkbookDisplay jsonData={jsonData} backButton={this.backToUpload} />
        );
      } else {
        return (
          <div>
            {failedMessage}
            <WorkbookUpload submitData={this.submitFile} />
          </div>
        );
      }
    }
  }
}

export default WorkbookConversion;

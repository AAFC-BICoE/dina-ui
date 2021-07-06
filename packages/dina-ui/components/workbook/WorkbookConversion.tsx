import React, { Component } from "react";
import { LoadingSpinner } from "common-ui";
import Kitsu from "kitsu";
import WorkbookDisplay from "./WorkbookDisplay";
import WorkbookUpload from "./WorkbookUpload";

interface WorkbookProps {
  apiClient: Kitsu;
}

interface WorkbookStates {
  jsonData?: string[][];
  loading: boolean;
}

/**
 * The parent component used for the workbook conversion task.
 */
export class WorkbookConversion extends Component<
  WorkbookProps,
  WorkbookStates
> {
  constructor(props: WorkbookProps) {
    super(props);

    // Configure default states.
    this.state = {
      loading: false
    };
  }

  /**
   * Method used to take an excel file and pass it to the API that converts it to the JSON.
   *
   * The JSON data is populated as a state.
   *
   * @param acceptedFile IMetadata file.
   */
  submitFile = async acceptedFile => {
    const { apiClient } = this.props;
    const formData = new FormData();
    formData.append("file", acceptedFile[0].file);

    // Display the loading spinner...
    this.setState({ loading: true });

    // Attempt to call the conversion API.
    await apiClient.axios
      .post("/objectstore-api/conversion/workbook", formData)
      .then(response => {
        this.setState({
          jsonData: response.data,
          loading: false
        });
      });
  };

  render() {
    // Deconstruct the states.
    const { loading, jsonData } = this.state;

    // Determine which component should be rendered based on the states.
    if (loading) {
      // Display the loading spinner.
      return <LoadingSpinner loading={true} />;
    } else {
      // If the json data is provided, display the JSON as a table. Otherwise display the uploading component.
      if (jsonData) {
        return <WorkbookDisplay jsonData={jsonData} />;
      } else {
        return <WorkbookUpload submitData={this.submitFile} />;
      }
    }
  }
}

export default WorkbookConversion;

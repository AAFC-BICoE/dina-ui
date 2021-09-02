import React, { Component } from "react";
import { ImportCollection } from "../../types/collection-api/";
import { LoadingSpinner } from "common-ui";
import { IFileWithMeta } from "../object-store/file-upload/FileUploader";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { AnyObjectSchema } from "yup";
import Kitsu from "kitsu";
import WorkbookDisplay from "./WorkbookDisplay";
import WorkbookUpload from "./WorkbookUpload";

const definedTypes: AnyObjectSchema[] = [ImportCollection];

interface WorkbookProps {
  apiClient: Kitsu;
}

interface WorkbookStates {
  /** Json data provided directly from the spreadsheet. */
  jsonData: WorkbookJSON | null;

  /** Loading state to display a loading indicator. */
  loading: boolean;

  /** Boolean state to determine if an error message should be displayed. */
  failed: boolean;

  /** The type of import the user is trying to perform. */
  selectedType: string | null;

  /** Workbook columns. */
  selectedColumns: WorkbookColumn[] | null;
}

interface WorkbookColumn {
  /** Spreadsheet column name provided. */
  columnName: string;

  /** Index where the column is presented. */
  columnIndex: number;

  /** What the column represents when importing. */
  typeColumn: string;
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

export interface SchemaDescription {
  type: string;
  label: string;
  meta: object;
  tests: { name: string; params: object }[];
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

    this.state = {
      loading: false,
      jsonData: null,
      selectedColumns: [],
      selectedType: null,
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
        // Ensure a proper response has been given.
        if (!response.data) {
          this.setState({
            jsonData: null,
            loading: false,
            failed: true
          });
        }

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

    // If not failed, then we can try to determine the workbook type.
    if (!this.state.failed && this.state.jsonData) {
      this.determineType(this.state.jsonData);
    }
  };

  /**
   * Once a workbook spreadsheet has been uploaded, this function is used to try and determine
   * the type of import the user wanted to perform.
   *
   * The possible import types are listed under the definedType constant. It will used the schemas
   * and the header information to guess which import you are trying to do.
   *
   * If none can be determine, the user can always manually select an import type.
   */
  determineType = (workbookData: WorkbookJSON) => {
    // Get the spreadsheet header row, this will be used to determine the import type.s
    const workbookHeader: string[] = workbookData[0].content;
    let matches = 0;
    let highestMatchedColumns = 0;
    let highestMatchedType;

    // Loop through each of the supported types.
    definedTypes.map(type => {
      // Reset the match count since we are now looking at a different type.
      matches = 0;

      // Loop through each header provided by the uploaded workbook.
      workbookHeader.map(header => {
        // Loop through the supported columns from the supported types..
        const definedTypeFields: string[] = Object.keys(type.describe().fields);
        definedTypeFields.map(field => {
          // Column from the uploaded spreadsheet matches a column from a supported type.
          if (header.toLowerCase() === field.toLowerCase()) {
            matches++;
          }

          // If this has more matches, then it becomes the recommended type.
          if (matches > highestMatchedColumns) {
            highestMatchedColumns = matches;
            highestMatchedType = type.describe().label;
          }
        });
      });
    });

    if (highestMatchedColumns === 0) {
      // No matches found, just set the selected type as null. User will need to manually enter this.
      this.setState({
        selectedType: null
      });
    } else {
      // Change the type based on the highest match.
      this.setState({
        selectedType: highestMatchedType
      });
    }
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

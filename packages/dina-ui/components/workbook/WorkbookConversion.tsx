import React, { Component } from "react";
import { CollectionImport } from "../../types/collection-api";
import { RegionImport } from "../../types/seqdb-api";
import { LoadingSpinner } from "common-ui";
import { IFileWithMeta } from "../object-store/file-upload/FileUploader";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { AnyObjectSchema } from "yup";
import Kitsu from "kitsu";
import WorkbookDisplay, { SelectImportType } from "./WorkbookDisplay";
import WorkbookUpload from "./WorkbookUpload";

export const definedTypes: WorkbookType[] = [
  {
    name: "collection",
    fields: [
      {
        name: "group",
        required: true
      } as WorkbookGroupField,
      {
        name: "name",
        required: true,
        maxLength: 250
      } as WorkbookStringField,
      {
        name: "code",
        required: false,
        maxLength: 10
      } as WorkbookStringField
    ]
  },
  {
    name: "region",
    fields: [
      {
        name: "group",
        required: true
      } as WorkbookGroupField,
      {
        name: "symbol",
        required: true,
        maxLength: 50
      } as WorkbookStringField,
      {
        name: "name",
        required: false
      } as WorkbookStringField,
      {
        name: "description",
        required: false
      } as WorkbookStringField,
      {
        name: "aliases",
        required: false
      } as WorkbookStringField
    ]
  }
];

export interface Workbook {
  columns: WorkbookColumn[];
  data: WorkbookJSON | null;
  type: WorkbookType | null;
}

export interface WorkbookColumn {
  name: string;
  index: number;
  field: WorkbookField;
}

export interface WorkbookType {
  name: string;
  fields: WorkbookField[];
}

export interface WorkbookField {
  name: string;
  value: any;
  required: boolean;
}

export interface WorkbookStringField extends WorkbookField {
  value: string;
  minLength: number;
  maxLength: number;
}

export interface WorkbookNumberField extends WorkbookField {
  value: number;
  minValue: number;
  maxValue: number;
}

export interface WorkbookDropdownField extends WorkbookField {
  value: string;
}

export interface WorkbookGroupField extends WorkbookField {
  value: number;
}

interface WorkbookProps {
  apiClient: Kitsu;
}

interface WorkbookStates {
  /** Workbook Object */
  workbook: Workbook | null;

  /** Loading state to display a loading indicator. */
  loading: boolean;

  /** Boolean state to determine if an error message should be displayed. */
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
      workbook: null,
      loading: false,
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
            workbook: null,
            loading: false,
            failed: true
          });
        }

        this.setState({
          workbook: {
            data: response.data,
            columns: [],
            type: null
          } as Workbook,
          loading: false,
          failed: false
        });
      })
      .catch(() => {
        this.setState({
          workbook: null,
          loading: false,
          failed: true
        });
      });

    // If not failed, then we can try to determine the workbook type.
    if (!this.state.failed && this.state.workbook !== undefined) {
      this.determineType();
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
  determineType = () => {
    const { workbook } = this.state;
    if (workbook === null || workbook.data === null) {
      return;
    }

    // Get the spreadsheet header row, this will be used to determine the import type.s
    const workbookHeader: string[] = workbook.data[0].content;
    let matches = 0;
    let highestMatchedColumns = 0;
    let highestMatchedType: WorkbookType | null = null;

    // Loop through each of the supported types.
    definedTypes.map((type: WorkbookType) => {
      // Reset the match count since we are now looking at a different type.
      matches = 0;

      // Loop through each header provided by the uploaded workbook.
      workbookHeader.map((header: string) => {
        // Loop through the supported columns from the supported types..
        type.fields.map((field: WorkbookField) => {
          // Column from the uploaded spreadsheet matches a column from a supported type.
          if (header.toLowerCase() === field.name.toLowerCase()) {
            matches++;
          }

          // If this has more matches, then it becomes the recommended type.
          if (matches > highestMatchedColumns) {
            highestMatchedColumns = matches;
            highestMatchedType = type;
          }
        });
      });
    });

    if (highestMatchedColumns === 0) {
      // No matches found, just set the selected type as null. User will need to manually enter this.
      workbook.type = null;
    } else {
      // Change the type based on the highest match.
      workbook.type = highestMatchedType;

      // Match the columns with the new selected type.
      this.determineColumns();
    }
  };

  /**
   * Based on the selected import type, we will try to match the columns of the spreadsheet
   * with the properties of the import type.
   */
  determineColumns = () => {
    const { workbook } = this.state;

    // Can't determine the columns if the selected type has not been selected.
    if (workbook === null || workbook.data === null) {
      return;
    }

    // Workbook headers.
    const workbookHeader: string[] = workbook.data[0].content;

    // Workbook column structure.
    const columnStructure: WorkbookColumn[] = [];

    // Get the fields for the selected type.
    workbook.type?.fields.map((field: WorkbookField) => {
      // Go through each of the spreadsheet headers and match it to a field.
      workbookHeader.map((header: string, index: number) => {
        if (field.name.toLowerCase() === header.toLowerCase()) {
          columnStructure.push({
            index,
            name: header,
            field
          });
        }
      });
    });

    // Set the workbook columns as a state to the workbook.
    workbook.columns = columnStructure;
  };

  /**
   * Change the workbook type, this method is called when the dropdown has been changed.
   *
   * @param newType Selected type from the dropdown after change.
   */
  changeType = (newType: SelectImportType) => {
    const { workbook } = this.state;
    if (workbook === null) {
      return;
    }

    workbook.type = newType.value;
    this.determineColumns();
  };

  /**
   * Back button functionality will reset the state to display the upload component.
   */
  backToUpload = () => {
    this.setState({
      loading: false,
      workbook: null
    });
  };

  render() {
    // Deconstruct the states.
    const { loading, failed, workbook } = this.state;

    // If failed display the error message.
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
      // If the json data is provided, display the JSON as a table. Otherwise display the uploading component.
      if (workbook?.data) {
        return (
          <WorkbookDisplay
            workbook={workbook}
            backButton={this.backToUpload}
            changeType={this.changeType}
          />
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

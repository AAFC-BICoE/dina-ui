import { HotColumnProps } from "@handsontable/react";
import { Component } from "react";
import { DinaMessage } from "../../intl/dina-ui-intl";
import {
  WorkbookJSON,
  WorkbookRow,
  WorkbookColumn,
  Workbook,
  definedTypes,
  WorkbookType
} from "./WorkbookConversion";
import { DynamicHotTable } from "../../../common-ui/lib/bulk-data-editor/BulkDataEditor";
import Select from "react-select";

interface WorkbookDisplayProps {
  workbook: Workbook;
  backButton: () => void;
  changeType: (value: SelectImportType) => void;
}

export interface SelectImportType {
  label: string;
  value: WorkbookType;
}

export class WorkbookDisplay extends Component<WorkbookDisplayProps> {
  render() {
    // const types: AnyObjectSchema[] = definedTypes;
    const { workbook } = this.props;

    if (workbook.data) {
      return (
        <div>
          <button
            type="button"
            className="btn btn-outline-secondary mrgn-bttm-md"
            onClick={this.props.backButton}
          >
            <DinaMessage id="cancelButtonText" />
          </button>

          <Select<SelectImportType>
            options={definedTypes.map((type: WorkbookType) => {
              return {
                label: type.name,
                value: type
              } as SelectImportType;
            })}
            className="col-md-3 mrgn-tp-md"
            name="importType"
            onChange={this.props.changeType}
          />

          {workbook.columns?.map((column: WorkbookColumn) => {
            return (
              <Select
                options={[
                  {
                    label: column.name,
                    value: "test"
                  }
                ]}
                key=""
              />
            );
          })}

          <div>
            <br />
            <DynamicHotTable
              columns={generateWorkbookColumns(workbook.columns)}
              data={generateWorkbookRows(workbook.data)}
              manualColumnResize={true}
              rowHeaders={true}
              contextMenu={[
                "row_above",
                "row_below",
                "col_left",
                "col_right",
                "remove_row",
                "clear_column",
                "undo",
                "redo"
              ]}
              dropdownMenu={true}
            />
          </div>
        </div>
      );
    }
  }
}

/**
 * Generate the columns structure required for handsontable. The headers will be the first
 * row found on the workbook uploaded by default.
 *
 * @param jsonData Excel data from the workbook.
 */
function generateWorkbookColumns(columns: WorkbookColumn[]): HotColumnProps[] {
  const generateColumns: HotColumnProps[] = [];
  columns.map((column: WorkbookColumn) => {
    generateColumns.push({
      title: column.name,
      type: "text"
    });
  });

  return generateColumns;
}

/**
 * Generate the rows for each of the rows uploaded.
 *
 * @param jsonData Excel data from the workbook.
 */
function generateWorkbookRows(jsonData: WorkbookJSON) {
  const generateRows: string[][] = [];
  jsonData.map((row: WorkbookRow, index: number) => {
    // Skip the header row since it has been already generated.
    if (index !== 0) {
      generateRows.push(row.content);
    }
  });

  return generateRows;
}

export default WorkbookDisplay;

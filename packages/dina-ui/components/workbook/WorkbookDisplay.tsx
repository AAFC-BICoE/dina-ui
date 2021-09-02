import { HotColumnProps } from "@handsontable/react";
import { Component } from "react";
import { DinaMessage } from "../../intl/dina-ui-intl";
import {
  WorkbookJSON,
  WorkbookRow,
  WorkbookColumn,
  definedTypes
} from "./WorkbookConversion";
import { DynamicHotTable } from "../../../common-ui/lib/bulk-data-editor/BulkDataEditor";
import Select from "react-select";
import { AnyObjectSchema } from "yup";

interface WorkbookDisplayProps {
  jsonData: WorkbookJSON;
  currentType: string | null;
  backButton: () => void;
  changeType: (value: string | null) => void;
  selectedColumns: WorkbookColumn[] | null;
}

export class WorkbookDisplay extends Component<WorkbookDisplayProps> {
  render() {
    const types: AnyObjectSchema[] = definedTypes;
    const { jsonData, selectedColumns } = this.props;

    if (jsonData) {
      return (
        <div>
          <button
            type="button"
            className="btn btn-outline-secondary mrgn-bttm-md"
            onClick={this.props.backButton}
          >
            <DinaMessage id="cancelButtonText" />
          </button>

          <Select
            options={types.map(type => {
              return {
                label: type.describe().label,
                value: type.describe().label
              };
            })}
            className="col-md-3 mrgn-tp-md"
            name="importType"
            // onChange={this.props.changeType}
          />

          {selectedColumns?.map((column: WorkbookColumn) => {
            return (
              <Select
                options={[
                  {
                    label: "test",
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
              columns={generateWorkbookColumns(jsonData)}
              data={generateWorkbookRows(jsonData)}
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
function generateWorkbookColumns(jsonData: WorkbookJSON): HotColumnProps[] {
  const generateColumns: HotColumnProps[] = [];
  jsonData[0].content.map(columnName => {
    generateColumns.push({
      title: columnName,
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

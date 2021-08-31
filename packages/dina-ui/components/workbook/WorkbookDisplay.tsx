import { HotColumnProps } from "@handsontable/react";
import { Component } from "react";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { WorkbookJSON, WorkbookRow } from "./WorkbookConversion";
import { DynamicHotTable } from "../../../common-ui/lib/bulk-data-editor/BulkDataEditor";

interface WorkbookDisplayProps {
  jsonData: WorkbookJSON;
  backButton: () => void;
}

export class WorkbookDisplay extends Component<WorkbookDisplayProps> {
  render() {
    const { jsonData } = this.props;

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
          <div>
            <br />
            <DynamicHotTable
              // afterValidate={afterValidate}
              columns={generateWorkbookColumns(jsonData)}
              data={generateWorkbookRows(jsonData)}
              manualColumnResize={true}
              rowHeaders={true}
              debug={true}
              // viewportColumnRenderingOffset={1000}
              // viewportRowRenderingOffset={1000}
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
      data: columnName,
      title: columnName
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

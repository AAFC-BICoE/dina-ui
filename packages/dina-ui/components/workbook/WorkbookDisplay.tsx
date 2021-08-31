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
            <DynamicHotTable
              // afterValidate={afterValidate}
              columns={generateWorkbookColumns(jsonData)}
              // data={workingTableData as any}
              manualColumnResize={true}
              rowHeaders={true}
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
 * Generate the columns structure required for handsontable.
 */
export function generateWorkbookColumns(
  jsonData: WorkbookJSON
): HotColumnProps[] {
  const generateColumns: HotColumnProps[] = [];
  jsonData[0].content.map(columnName => {
    generateColumns.push({
      data: "",
      title: columnName
    });
  });

  return generateColumns;
}

export default WorkbookDisplay;

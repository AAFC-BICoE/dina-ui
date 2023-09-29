import { take } from "lodash";
import { WorkbookJSON, WorkbookRow } from "./types/Workbook";
import { Card } from "react-bootstrap";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";

/**
 * This component is currently not used anywhere yet. It will be implemented in a future ticket.
 */
export function WorkbookDisplay({
  jsonData,
  sheetIndex
}: {
  jsonData: WorkbookJSON;
  sheetIndex: number;
}) {
  const dataToDisplay = take(jsonData[sheetIndex], 10);
  const numOfColumns = dataToDisplay[0].content.length;
  const numOfRows = dataToDisplay.length - 1;
  const headerRow = dataToDisplay[0].content.map((col) => (
    <div className="cells__alphabet" key={col}>
      {col}
    </div>
  ));
  const excelIndexColumn = [...Array(numOfRows)].map((_, i) => (
    <div key={i} className="cells__number">
      {i + 1}
    </div>
  ));
  const dataRows = dataToDisplay.map((row: WorkbookRow, index: number) => {
    // Skip the first row since it's already been displayed.
    if (index !== 0) {
      return row.content.map((col, i) => (
        <div key={i} className="cells__content">
          {col}
        </div>
      ));
    }
  });
  return (
    <>
      <style>{`
          .cells {
            position: relative;
            display: grid;
            grid-template-columns: 40px repeat(${numOfColumns}, calc((100% - 53px) / ${numOfColumns}));
            grid-template-rows: 50px repeat(${numOfRows}, 30px);
            grid-gap: 1px;
            background: #cdcdcd;
            grid-auto-flow: dense;
            max-width: 100%;
            overflow: hidden;
            height: calc(51px + ${numOfRows}*31px);
          }
          .cells__spacer {
            background: #e6e6e6;
            position: relative;
          }
          .cells__spacer:after {
            content: "";
            position: absolute;
            right: 4px;
            bottom: 4px;
            height: 80%;
            width: 100%;
            background: linear-gradient(135deg, transparent 30px, #bbb 30px, #bbb 55px, transparent 55px);
          }
          .cells__alphabet {
            background: #e6e6e6;
            display: flex;
            justify-content: center;
            align-items: center;
            word-wrap: anywhere;
          }
          .cells__number {
            background: #e6e6e6;
            grid-column: 1/span 1;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .cells__content {
            text-align: left;
            padding: 6px;
            background: #fff;
          }
          .cells__content_header {
            text-align: left;
            padding: 6px;
            background: #f3f2f1;
          }
        `}</style>
      <Card
        className="mb-3"
        style={{ width: "100%", overflowX: "auto", height: "70hp" }}
      >
        <Card.Header>
          <DinaMessage id="workbookPreviewTitle" /> ({numOfRows} /{" "}
          {jsonData[sheetIndex].length})
        </Card.Header>
        <Card.Body>
          <div className="cells">
            <div className="cells__spacer" />
            {headerRow}
            {excelIndexColumn}
            {dataRows}
          </div>
        </Card.Body>
      </Card>
    </>
  );
}

import { WorkbookRow, WorkbookJSON } from "./types/Workbook";

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
  return (
    <div style={{ width: "100%", overflowX: "auto", height: "70hp" }}>
      <table className="table">
        <thead>
          <tr>
            {jsonData[sheetIndex][0].content.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jsonData[sheetIndex].map((row: WorkbookRow, index: number) => {
            // Skip the first row since it's already been displayed.
            if (index !== 0) {
              return (
                <tr key={row.rowNumber}>
                  {row.content.map((col) => {
                    // Render the columns inside of the row.
                    return <td key={col}>{col}</td>;
                  })}
                </tr>
              );
            }
          })}
        </tbody>
      </table>
    </div>
  );
}

import { WorkbookRow, WorkbookJSON } from "./types/Workbook";

export function WorkbookDisplay({ jsonData }: { jsonData: WorkbookJSON }) {
  return (
    <div style={{ width: "100%", overflowX: "auto", height: "70hp" }}>
      <table className="table">
        <thead>
          <tr>
            {jsonData[0].content.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jsonData.map((row: WorkbookRow, index: number) => {
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

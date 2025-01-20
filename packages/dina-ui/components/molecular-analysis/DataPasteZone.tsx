import { FieldHeader } from "packages/common-ui/lib";
import React, { useState } from "react";

interface DataPasteZoneProps {}

export default function DataPasteZone({}: DataPasteZoneProps) {
  const [tableData, setTableData] = useState<string[][]>([]);

  // Handle paste event
  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = event.clipboardData.getData("text/plain");
    const rows = clipboardData
      .trim()
      .split("\n")
      .map((row) => row.split("\t")); // Split rows by tabs (Excel delimiter)

    setTableData(rows);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <FieldHeader name={"extractedData"} />
      <textarea
        placeholder="Paste your data here (e.g., copied from Excel)"
        onPaste={handlePaste}
        style={{
          width: "100%",
          height: "100px",
          marginBottom: "20px",
          padding: "10px",
          borderRadius: "5px",
          border: "1px solid #ccc",
          fontSize: "16px",
          resize: "none"
        }}
      />
      {tableData.length > 1 && (
        <div className="row">
          <div className="col-md-6">
            <FieldHeader name={"extractedData"} />
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "20px"
              }}
            >
              <thead>
                <tr>
                  {tableData[0].map((header, index) => (
                    <th
                      key={index}
                      style={{
                        border: "1px solid #ccc",
                        padding: "8px",
                        backgroundColor: "#f4f4f4"
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.slice(1).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        style={{
                          border: "1px solid #ccc",
                          padding: "8px",
                          textAlign: "left"
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

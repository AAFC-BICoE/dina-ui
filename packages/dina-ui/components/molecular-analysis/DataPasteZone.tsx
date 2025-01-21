import React, { useState } from "react";
import { FieldHeader } from "packages/common-ui/lib";

interface DataPasteZoneProps {}

export default function DataPasteZone({}: DataPasteZoneProps) {
  const [extractedTableData, setExtractedTableData] = useState<string[][]>([]);
  const [mappedTableData, setMappedTableData] = useState<string[][]>([]);
  const [selectedColumn, setSelectedColumn] = useState<number | undefined>(
    undefined
  );
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = event.clipboardData.getData("text/plain");
    const rows = clipboardData
      .trim()
      .split("\n")
      .map((row) => row.split("\t"));
    setExtractedTableData(rows);
  };

  const toggleRowSelection = (index: number) => {
    setSelectedRows((prevSelectedRows) => {
      const newSelectedRows = new Set(prevSelectedRows);
      if (newSelectedRows.has(index)) {
        newSelectedRows.delete(index);
      } else {
        newSelectedRows.add(index);
      }
      return newSelectedRows;
    });
  };

  const removeSelectedRows = () => {
    setExtractedTableData((prevData) =>
      prevData.filter((_, index) => !selectedRows.has(index))
    );
    setSelectedRows(new Set());
  };

  const transferData = () => {
    if (selectedColumn !== undefined) {
      setMappedTableData(
        extractedTableData.map((row) => [row[selectedColumn] || "", ""])
      );
    }
  };

  return (
    <div style={{ width: "100%", padding: "1.25rem", boxSizing: "border-box" }}>
      <strong>
        <FieldHeader name={"dataPasteZone"} />
      </strong>
      <textarea
        placeholder="Paste your data here (e.g., copied from Excel)"
        onPaste={handlePaste}
        style={{
          width: "100%",
          height: "6.25rem",
          marginBottom: "1.25rem",
          padding: "0.625rem",
          borderRadius: "0.3125rem",
          border: "0.0625rem solid #ccc",
          fontSize: "1rem",
          resize: "none"
        }}
      />
      {extractedTableData.length > 0 && (
        <div>
          <div>
            <label>
              Select column:
              <select
                onChange={(e) => setSelectedColumn(Number(e.target.value))}
                value={selectedColumn ?? ""}
                style={{ marginLeft: "0.625rem" }}
              >
                <option value="">-- Select Column --</option>
                {extractedTableData[0].map((_, index) => (
                  <option key={index} value={index}>{`Column ${
                    index + 1
                  }`}</option>
                ))}
              </select>
            </label>
          </div>
          <div
            style={{
              display: "inline-flex",
              justifyContent: "center",
              gap: "1.25rem",
              width: "100%",
              flexWrap: "wrap" // Make sure the tables stack when needed
            }}
          >
            <div
              style={{ flex: "1", minWidth: "18.75rem", maxWidth: "37.5rem" }}
            >
              <strong style={{ marginBottom: "0.3125rem" }}>
                <FieldHeader name={"extractedData"} />
              </strong>
              <div style={{ maxHeight: "18.75rem", overflow: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    tableLayout: "fixed" // Fixed column widths
                  }}
                >
                  <tbody>
                    {extractedTableData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td
                          style={{
                            border: "0.0625rem solid #ccc",
                            padding: "0.5rem",
                            textAlign: "center",
                            backgroundColor:
                              selectedColumn === 0 ? "#d3f4ff" : "inherit",
                            width: "2.5rem" // Adjust width to fit checkbox
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRows.has(rowIndex)}
                            onChange={() => toggleRowSelection(rowIndex)}
                            style={{ marginRight: "0.3125rem" }}
                          />
                        </td>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            style={{
                              border: "0.0625rem solid #ccc",
                              padding: "0.5rem",
                              textAlign: "left",
                              backgroundColor:
                                selectedColumn === cellIndex
                                  ? "#d3f4ff"
                                  : "inherit",
                              wordWrap: "break-word", // Prevent text overflow
                              maxWidth: "12.5rem", // Limit the width of the cell
                              whiteSpace: "normal" // Allow line breaks if text is long
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
            <div
              style={{
                display: "flex",
                flexDirection: "column", // Stack buttons vertically
                gap: "1rem", // Add gap between buttons
                justifyContent: "center"
              }}
            >
              <button
                className="btn btn-primary"
                style={{
                  height: "2.5rem",
                  marginTop: "3.125rem",
                  flexShrink: 0
                }}
                onClick={transferData}
              >
                {">>"}
              </button>
              <button
                onClick={removeSelectedRows}
                className="btn btn-primary"
                style={{ marginTop: "0.625rem" }}
              >
                Remove Rows
              </button>
            </div>

            <div
              style={{ flex: "1", minWidth: "18.75rem", maxWidth: "37.5rem" }}
            >
              <strong style={{ marginBottom: "0.3125rem" }}>
                <FieldHeader name={"mappedData"} />
              </strong>
              <div style={{ maxHeight: "18.75rem", overflow: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    tableLayout: "fixed" // Fixed column widths
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          border: "0.0625rem solid #ccc",
                          padding: "0.5rem",
                          backgroundColor: "#f4f4f4"
                        }}
                      >
                        Original
                      </th>
                      <th
                        style={{
                          border: "0.0625rem solid #ccc",
                          padding: "0.5rem",
                          backgroundColor: "#f4f4f4"
                        }}
                      >
                        Mapped
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappedTableData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td
                          style={{
                            border: "0.0625rem solid #ccc",
                            padding: "0.5rem",
                            textAlign: "left"
                          }}
                        >
                          {row[0]}
                        </td>
                        <td
                          style={{
                            border: "0.0625rem solid #ccc",
                            padding: "0.5rem",
                            textAlign: "left"
                          }}
                        >
                          {row[1] ?? ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

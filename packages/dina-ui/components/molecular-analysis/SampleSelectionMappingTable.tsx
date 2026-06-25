import { useDinaIntl } from "../../intl/dina-ui-intl";
import React, { Dispatch, SetStateAction, useState } from "react";
import Link from "next/link";
import { FieldHeader } from "../../../common-ui/lib";
import Select from "react-select";
import { FiChevronRight } from "react-icons/fi";

interface SampleSelectionMappingTableProps {
  extractedDataTable: string[][];
  onTransferData?: (
    selectedColumn: number | undefined,
    extractedDataTable: string[][],
    setMappedDataTable: React.Dispatch<React.SetStateAction<MappedDataRow[]>>
  ) => void;
}
interface MappedResource {
  id?: string;
  type?: string;
  name?: string;
  path?: string;
}

export type MappedDataRow = [string, MappedResource] | [];
export function SampleSelectionMappingTable({
  extractedDataTable,
  onTransferData
}: SampleSelectionMappingTableProps) {
  const { formatMessage } = useDinaIntl();
  const [mappedDataTable, setMappedDataTable] = useState<MappedDataRow[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<number | undefined>(
    undefined
  );

  const transferData = async () => {
    onTransferData?.(selectedColumn, extractedDataTable, setMappedDataTable);
  };
  const maxColumns = Math.max(
    ...extractedDataTable.map((row) => row.length),
    0
  );
  return (
    <>
      {extractedDataTable.length > 0 && (
        <div>
          <div style={{ marginLeft: "1.25rem" }}>
            <label>
              <strong>{formatMessage("selectColumn")}:</strong>

              <Select
                options={
                  extractedDataTable[0]?.map((_, index) => ({
                    value: index,
                    label: formatMessage("columnNumber", {
                      columnNumber: `${index + 1}`
                    })
                  })) || []
                }
                onChange={(e) => setSelectedColumn(e?.value)}
                value={
                  selectedColumn !== undefined
                    ? {
                        value: selectedColumn,
                        label: formatMessage("columnNumber", {
                          columnNumber: `${selectedColumn + 1}`
                        })
                      }
                    : null
                }
                placeholder={formatMessage("selectColumnPlaceholder")}
                className="basic-single"
                classNamePrefix="select"
                // add style to make it wider
                styles={{
                  control: (base) => ({
                    ...base,
                    width: "12.5rem",
                    marginBottom: "1rem"
                  })
                }}
              />
            </label>
          </div>
          <div
            style={{
              display: "inline-flex",
              justifyContent: "center",
              gap: "1.8rem",
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
                  <thead>
                    <tr>
                      {Array.from({ length: maxColumns }, (_, i) => (
                        <th
                          key={i}
                          style={{
                            border: "0.0625rem solid #ccc",
                            padding: "0.5rem",
                            backgroundColor: "#f4f4f4"
                          }}
                        >
                          {formatMessage("columnNumber", {
                            columnNumber: `${i + 1}`
                          })}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {extractedDataTable.map((row, rowIndex) => {
                      // Ensure all rows have the same number of columns by padding with empty strings
                      const paddedRow = [
                        ...row,
                        ...Array(maxColumns - row.length).fill("")
                      ];

                      return (
                        <tr key={rowIndex}>
                          {paddedRow.map((cell, cellIndex) => (
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
                      );
                    })}
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
                <FiChevronRight />
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
                        {formatMessage("originalColumnHeader")}
                      </th>
                      <th
                        style={{
                          border: "0.0625rem solid #ccc",
                          padding: "0.5rem",
                          backgroundColor: "#f4f4f4"
                        }}
                      >
                        {formatMessage("mappedColumnHeader")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappedDataTable.map((row, rowIndex) => (
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
                          {row[1]?.path ? (
                            <Link href={row[1]?.path} legacyBehavior>
                              {row[1]?.name}
                            </Link>
                          ) : (
                            row[1]?.name
                          )}
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
    </>
  );
}

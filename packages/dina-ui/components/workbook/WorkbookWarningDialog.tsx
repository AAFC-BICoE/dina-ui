import React, { useState } from "react";
import { Button } from "react-bootstrap";

export interface WorkbookWarningDialogProps {
  /**
   * List of all the columns that will be skipped. An empty array if no columns are skipped.
   */
  skippedColumns: string[];

  /**
   * List of all the columns that are unmapped relationships. An empty array if no columns are unmapped.
   */
  unmappedRelationshipsError: string[];
}

export function WorkbookWarningDialog({
  skippedColumns,
  unmappedRelationshipsError
}: WorkbookWarningDialogProps) {
  /** The maximum columns to be displayed if not opened. */
  const MAX_VISIBLE_ELEMENTS = 3;

  const [isSkippedColumnExpanded, setIsSkippedColumnExpanded] = useState(false);
  const [isUnmappedRelationshipsExpanded, setIsUnmappedRelationshipsExpanded] =
    useState(false);

  const handleToggle =
    (isOpenState: boolean, setIsOpen: (openState: boolean) => void) => () => {
      setIsOpen(!isOpenState);
    };

  const displayedColumns = (columns: string[], isOpen: boolean) => {
    return columns.slice(0, isOpen ? columns.length : MAX_VISIBLE_ELEMENTS);
  };

  return (
    <>
      <h4>Skipped Columns</h4>
      <p>
        The workbook contains columns that will be skipped during import. These
        columns might contain important data.
      </p>
      <div className="card well px-2 py-2 mb-3">
        <span>
          {displayedColumns(skippedColumns, isSkippedColumnExpanded).join(", ")}
          {skippedColumns.length > MAX_VISIBLE_ELEMENTS && (
            <Button
              size={"sm"}
              variant="secondary"
              className="ms-3"
              onClick={handleToggle(
                isSkippedColumnExpanded,
                setIsSkippedColumnExpanded
              )}
            >
              {isSkippedColumnExpanded ? "Hide" : " Show all..."}
            </Button>
          )}
        </span>
      </div>

      <h4>Unmapped Relationships</h4>
      <p>
        The import identified relationships in the workbook that could not be
        automatically mapped. This might lead to incomplete data transfer.
      </p>
      <div className="card well px-2 py-2 mb-3">
        <span>
          {displayedColumns(
            unmappedRelationshipsError,
            isUnmappedRelationshipsExpanded
          ).join(", ")}
          {unmappedRelationshipsError.length > MAX_VISIBLE_ELEMENTS && (
            <Button
              size={"sm"}
              variant="secondary"
              className="ms-3"
              onClick={handleToggle(
                isUnmappedRelationshipsExpanded,
                setIsUnmappedRelationshipsExpanded
              )}
            >
              {isUnmappedRelationshipsExpanded ? "Hide" : " Show all..."}
            </Button>
          )}
        </span>
      </div>
    </>
  );
}

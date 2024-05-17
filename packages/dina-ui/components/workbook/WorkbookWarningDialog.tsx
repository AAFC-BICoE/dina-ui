import { DinaMessage } from "../../intl/dina-ui-intl";
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
  const MAX_VISIBLE_ELEMENTS = 2;

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
      {skippedColumns.length !== 0 && (
        <>
          <h4>
            <DinaMessage id="skippedColumnsTitle" />
          </h4>
          <p>
            <DinaMessage id="skippedColumnsDescription" />
          </p>
          <div className="card well px-2 py-2 mb-3">
            <span>
              <span style={{ lineHeight: "31px" }}>
                {!isSkippedColumnExpanded ? (
                  displayedColumns(
                    skippedColumns,
                    isSkippedColumnExpanded
                  ).join(", ")
                ) : (
                  <ul style={{ textAlign: "left" }}>
                    {skippedColumns.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </span>
              {skippedColumns.length > MAX_VISIBLE_ELEMENTS && (
                <>
                  {!isSkippedColumnExpanded && "..."}
                  <Button
                    size={"sm"}
                    variant="secondary"
                    className="ms-3"
                    onClick={handleToggle(
                      isSkippedColumnExpanded,
                      setIsSkippedColumnExpanded
                    )}
                  >
                    {isSkippedColumnExpanded ? (
                      <DinaMessage id="showLess" />
                    ) : (
                      <DinaMessage id="showMore" />
                    )}
                  </Button>
                </>
              )}
            </span>
          </div>
        </>
      )}

      {unmappedRelationshipsError.length !== 0 && (
        <>
          <h4>
            <DinaMessage id="unmappedRelationshipsTitle" />
          </h4>
          <p>
            <DinaMessage id="unmappedRelationshipsDescription" />
          </p>
          <div className="card well px-2 py-2 mb-3">
            <span>
              {!isUnmappedRelationshipsExpanded ? (
                displayedColumns(
                  unmappedRelationshipsError,
                  isUnmappedRelationshipsExpanded
                ).join(", ")
              ) : (
                <ul style={{ textAlign: "left" }}>
                  {unmappedRelationshipsError.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {unmappedRelationshipsError.length > MAX_VISIBLE_ELEMENTS && (
                <>
                  {!isUnmappedRelationshipsExpanded && "..."}
                  <Button
                    size={"sm"}
                    variant="secondary"
                    className="ms-3"
                    onClick={handleToggle(
                      isUnmappedRelationshipsExpanded,
                      setIsUnmappedRelationshipsExpanded
                    )}
                  >
                    {isUnmappedRelationshipsExpanded ? (
                      <DinaMessage id="showLess" />
                    ) : (
                      <DinaMessage id="showMore" />
                    )}
                  </Button>
                </>
              )}
            </span>
          </div>
        </>
      )}
    </>
  );
}

import { DinaMessage } from "../../intl/dina-ui-intl";
import React, { useState } from "react";
import { Button } from "react-bootstrap";
import {
  DuplicatePrimaryId,
  getDuplicateRowNumbers
} from "./utils/workbookDuplicateUtils";

export interface WorkbookWarningDialogProps {
  /**
   * List of all the columns that will be skipped. An empty array if no columns are skipped.
   */
  skippedColumns: string[];

  /**
   * List of all the columns that are unmapped relationships. An empty array if no columns are unmapped.
   */
  unmappedRelationshipsError: string[];

  /**
   * Primary IDs found in the workbook. Only the local or server duplicates are displayed.
   */
  duplicatePrimaryIds?: DuplicatePrimaryId[];
}

/** The maximum items to be displayed if not opened. */
const MAX_VISIBLE_ELEMENTS = 2;

function ExpandableList({ items }: { items: string[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="card well px-2 py-2 mb-3">
      <span>
        <span style={{ lineHeight: "31px" }}>
          {!isExpanded ? (
            items.slice(0, MAX_VISIBLE_ELEMENTS).join(", ")
          ) : (
            <ul style={{ textAlign: "left" }}>
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </span>
        {items.length > MAX_VISIBLE_ELEMENTS && (
          <>
            {!isExpanded && "..."}
            <Button
              size={"sm"}
              variant="secondary"
              className="ms-3"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <DinaMessage id="showLess" />
              ) : (
                <DinaMessage id="showMore" />
              )}
            </Button>
          </>
        )}
      </span>
    </div>
  );
}

function formatDuplicate({
  materialSampleName,
  collectionName
}: DuplicatePrimaryId) {
  return collectionName
    ? `${materialSampleName} (${collectionName})`
    : materialSampleName;
}

export function WorkbookWarningDialog({
  skippedColumns,
  unmappedRelationshipsError,
  duplicatePrimaryIds = []
}: WorkbookWarningDialogProps) {
  const onSheetDuplicates = duplicatePrimaryIds
    .filter((entry) => entry.localDuplicate)
    .map(formatDuplicate);
  const onServerDuplicates = duplicatePrimaryIds
    .filter((entry) => !entry.localDuplicate && entry.serverDuplicate)
    .map(formatDuplicate);

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
          <ExpandableList items={skippedColumns} />
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
          <ExpandableList items={unmappedRelationshipsError} />
        </>
      )}

      {(onSheetDuplicates.length !== 0 || onServerDuplicates.length !== 0) && (
        <>
          <h4>
            <DinaMessage id="duplicatePrimaryIdsTitle" />
          </h4>
          <p className="fw-bold">
            <DinaMessage
              id="duplicatePrimaryIdsRowsSkipped"
              values={{
                count: getDuplicateRowNumbers(duplicatePrimaryIds).length
              }}
            />
          </p>
          {onSheetDuplicates.length !== 0 && (
            <>
              <p>
                <DinaMessage id="duplicatePrimaryIdsOnSheetDescription" />
              </p>
              <ExpandableList items={onSheetDuplicates} />
            </>
          )}
          {onServerDuplicates.length !== 0 && (
            <>
              <p>
                <DinaMessage id="duplicatePrimaryIdsOnServerDescription" />
              </p>
              <ExpandableList items={onServerDuplicates} />
            </>
          )}
        </>
      )}
    </>
  );
}

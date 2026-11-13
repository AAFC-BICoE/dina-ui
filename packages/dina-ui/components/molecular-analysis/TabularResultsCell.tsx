import { ChangeEvent, Dispatch, SetStateAction, useRef, useState } from "react";
import { Button, OverlayTrigger, Popover, Spinner } from "react-bootstrap";
import {
  FaExclamationCircle,
  FaExpandAlt,
  FaMousePointer,
  FaTable,
  FaUpload
} from "react-icons/fa";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { SequencingRunItem } from "./useMolecularAnalysisRun";
import { TabularResultsModal } from "./TabularResultsModal";
import { useTabularResultsUpload } from "./useTabularResultsUpload";

export interface TabularResultsCellProps {
  sequencingRunItem: SequencingRunItem;
  setSequencingRunItems?: Dispatch<
    SetStateAction<SequencingRunItem[] | undefined>
  >;
}

// How many rows of the tabular results to preview in the popover.
const PREVIEW_ROWS = 5;

/** "Tabular Results" cell of the Results tab: upload, quick view and full table of one TSV. */
export function TabularResultsCell({
  sequencingRunItem,
  setSequencingRunItems
}: TabularResultsCellProps) {
  const { formatMessage, locale } = useDinaIntl();
  const { status, fileName, submit, remove } = useTabularResultsUpload({
    sequencingRunItem,
    setSequencingRunItems
  });
  const fileInput = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [replaceFailed, setReplaceFailed] = useState(false);

  const runItemName = sequencingRunItem.molecularAnalysisRunItem?.name ?? "";
  const tabularResults =
    sequencingRunItem.molecularAnalysisRunItem?.result?.tabularResults;
  const records = tabularResults?.records ?? [];
  const hasData = !!tabularResults && records.length > 0;
  const columns = Object.keys(records[0] ?? {});
  const numberLocale = locale === "fr" ? "fr-CA" : "en-CA";
  const rowCount = records.length.toLocaleString(numberLocale);
  const columnCount = columns.length.toLocaleString(numberLocale);
  const counts = formatMessage("tabularResults_countShort", {
    rows: rowCount,
    cols: columnCount
  });

  async function onFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    const success = await submit(file);
    setReplaceFailed(!success);
  }

  const hiddenInput = (
    <input
      ref={fileInput}
      type="file"
      accept=".tsv,text/tab-separated-values"
      className="d-none"
      onChange={onFileSelected}
    />
  );

  // If the row has tabular results, this loads the popover support with the preview
  // and the full table view on click (modal)
  if (hasData) {
    const popover = (
      <Popover
        id={`tabular-results-peek-${sequencingRunItem.molecularAnalysisRunItemId}`}
        style={{ width: 600, maxWidth: "calc(100vw - 32px)" }}
      >
        <div className="px-3 py-2 border-bottom d-flex align-items-baseline gap-3">
          <strong className="text-break">{runItemName}</strong>
          <small className="text-muted text-nowrap">
            {rowCount} <DinaMessage id="tabularResults_rows" />, {columnCount}{" "}
            <DinaMessage id="tabularResults_columns" />
          </small>
        </div>
        <div className="px-3 py-2">
          <div className="border rounded overflow-hidden">
            <table
              className="table table-striped mb-0"
              style={{
                fontSize: ".8125rem",
                whiteSpace: "nowrap",
                width: "max-content",
                minWidth: "100%"
              }}
            >
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column} scope="col" className="px-3 py-2">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.slice(0, PREVIEW_ROWS).map((record, index) => (
                  <tr key={index}>
                    {columns.map((column) => (
                      <td key={column} className="px-3 py-2">
                        {String(record[column] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="px-3 py-2 border-top d-flex align-items-center gap-2 small text-muted">
          <span>
            <DinaMessage
              id="tabularResults_quickMore"
              values={{ rows: rowCount }}
            />
          </span>
          <span
            className="ms-auto fw-bold d-flex align-items-center gap-1"
            style={{ color: "#335075" }}
          >
            <FaMousePointer />
            <DinaMessage id="tabularResults_clickOpen" />
          </span>
        </div>
      </Popover>
    );

    return (
      <div className="d-flex align-items-center" style={{ minHeight: 38 }}>
        {hiddenInput}
        <OverlayTrigger
          placement="auto"
          trigger={["hover", "focus"]}
          delay={{ show: 0, hide: 100 }}
          overlay={popover}
        >
          <button
            type="button"
            className="btn btn-outline-secondary bg-white text-body d-inline-flex align-items-center gap-2 px-3"
            style={{ fontSize: ".875rem", height: 38 }}
            aria-haspopup="dialog"
            aria-label={formatMessage("tabularResults_openAria", {
              name: runItemName,
              counts
            })}
            onClick={() => setModalOpen(true)}
          >
            <FaTable size={18} style={{ color: "#335075" }} />
            <span className="text-decoration-underline">{counts}</span>
            <FaExpandAlt size={16} />
          </button>
        </OverlayTrigger>
        <TabularResultsModal
          show={modalOpen}
          runItemName={runItemName}
          tabularResults={tabularResults!}
          busy={status === "busy"}
          fileName={fileName}
          replaceFailed={replaceFailed && status === "error"}
          onReplace={() => fileInput.current?.click()}
          onRemove={async () => {
            if (await remove()) {
              setModalOpen(false);
            }
          }}
          onClose={() => setModalOpen(false)}
        />
      </div>
    );
  }

  // Upload in progress state...
  if (status === "busy") {
    return (
      <div
        role="status"
        className="d-flex align-items-center gap-2"
        style={{ minHeight: 38 }}
      >
        <Spinner animation="border" size="sm" />
        <span>
          <DinaMessage id="tabularResults_parsing" />
        </span>
        <span
          title={fileName}
          className="text-muted small text-truncate"
          style={{ maxWidth: 130 }}
        >
          {fileName}
        </span>
      </div>
    );
  }

  // Error state...
  if (status === "error") {
    return (
      <div
        role="alert"
        className="d-flex align-items-center gap-2 text-danger small"
        style={{ minHeight: 38 }}
      >
        {hiddenInput}
        <FaExclamationCircle size={18} />
        <span>
          <DinaMessage id="tabularResults_parseFailed" />
        </span>
        <button
          type="button"
          className="btn btn-link p-0 small"
          onClick={() => fileInput.current?.click()}
        >
          <DinaMessage id="tabularResults_retry" />
        </button>
      </div>
    );
  }

  // Nothing has been uploaded yet, display the upload button.
  return (
    <div className="d-flex align-items-center" style={{ minHeight: 38 }}>
      {hiddenInput}
      <Button
        variant="outline-secondary"
        className="btn-gray-text"
        disabled={!sequencingRunItem.molecularAnalysisRunItem}
        onClick={() => fileInput.current?.click()}
      >
        <FaUpload size={18} className="me-2" />
        <DinaMessage id="tabularResults_upload" />
      </Button>
    </div>
  );
}

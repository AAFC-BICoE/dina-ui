import { Alert, Button, Modal, Spinner } from "react-bootstrap";
import { FaTrashAlt, FaUpload } from "react-icons/fa";
import { useState } from "react";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { TabularResults } from "../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisResult";

// Table height for the modal, calculated to fill most of the viewport since we need to display
// potentially large tables.
const TABLE_HEIGHT = "calc(100vh - 17rem)";

export interface TabularResultsModalProps {
  show: boolean;
  runItemName: string;
  tabularResults: TabularResults;
  busy: boolean;
  fileName: string;
  replaceFailed: boolean;
  onReplace: () => void;
  onRemove: () => Promise<void>;
  onClose: () => void;
}

/**
 * This modal will display the full tabularResult as a scrollable table within a modal. There are
 * also buttons to replace or remove the tabular results.
 */
export function TabularResultsModal({
  show,
  runItemName,
  tabularResults,
  busy,
  fileName,
  replaceFailed,
  onReplace,
  onRemove,
  onClose
}: TabularResultsModalProps) {
  const { locale } = useDinaIntl();
  const [confirmRemove, setConfirmRemove] = useState(false);

  const columns = Object.keys(tabularResults.records[0] ?? {});
  const numberLocale = locale === "fr" ? "fr-CA" : "en-CA";

  return (
    <>
      <Modal
        show={show && !confirmRemove}
        onHide={onClose}
        // Nearly full width so wide tables are easier to read.
        dialogClassName="mw-100 mx-5"
        aria-labelledby="tabular-results-title"
      >
        {/* Header with title and close button */}
        <Modal.Header closeButton>
          <Modal.Title id="tabular-results-title">
            <DinaMessage
              id="tabularResults_modalTitle"
              values={{ name: runItemName }}
            />
          </Modal.Title>
        </Modal.Header>

        {/* Body with table and status messages */}
        <Modal.Body>
          <p className="mb-2">
            <strong>
              {tabularResults.records.length.toLocaleString(numberLocale)}
            </strong>{" "}
            <DinaMessage id="tabularResults_rows" />,{" "}
            <strong>{columns.length.toLocaleString(numberLocale)}</strong>{" "}
            <DinaMessage id="tabularResults_columns" />
          </p>
          {replaceFailed && (
            <Alert variant="danger">
              <DinaMessage id="tabularResults_replaceFailed" />
            </Alert>
          )}
          {busy ? (
            <div
              className="d-flex align-items-center justify-content-center gap-2"
              style={{ height: TABLE_HEIGHT }}
              role="status"
            >
              <Spinner animation="border" size="sm" />
              <DinaMessage id="tabularResults_parsing" />
              <span className="text-muted">{fileName}</span>
            </div>
          ) : (
            <div
              className="border rounded"
              style={{ maxHeight: TABLE_HEIGHT, overflow: "auto" }}
              tabIndex={0}
              role="region"
              aria-label={runItemName}
            >
              <table
                className="table table-striped mb-0"
                style={{
                  whiteSpace: "nowrap",
                  width: "max-content",
                  minWidth: "100%"
                }}
              >
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column}
                        scope="col"
                        className="px-3 py-2"
                        style={{
                          position: "sticky",
                          top: 0,
                          background: "#fff"
                        }}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tabularResults.records.map((record, index) => (
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
          )}
        </Modal.Body>

        {/* Footer with Replace and Remove buttons */}
        <Modal.Footer className="justify-content-between">
          <div className="d-flex gap-2">
            <Button variant="primary" disabled={busy} onClick={onReplace}>
              <FaUpload size={18} className="me-2" />
              <DinaMessage id="tabularResults_replaceFile" />
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => setConfirmRemove(true)}
            >
              <FaTrashAlt size={18} className="me-2" />
              <DinaMessage id="removeButtonText" />
            </Button>
          </div>
          <Button variant="secondary" onClick={onClose}>
            <DinaMessage id="close" />
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirmation modal for removing tabular results */}
      <Modal
        show={confirmRemove}
        onHide={() => setConfirmRemove(false)}
        size="lg"
        centered={true}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <DinaMessage id="tabularResults_confirmTitle" />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DinaMessage id="tabularResults_confirmText" />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirmRemove(false)}>
            <DinaMessage id="cancelButtonText" />
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              await onRemove();
              setConfirmRemove(false);
            }}
          >
            <FaTrashAlt size={18} className="me-2" />
            <DinaMessage id="removeButtonText" />
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

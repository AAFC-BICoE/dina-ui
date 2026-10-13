import PageLayout from "../../components/page/PageLayout";
import { Alert, Badge, Button, Card, Col, Form, Row } from "react-bootstrap";
import { FaExclamationTriangle, FaSyncAlt, FaUndo } from "react-icons/fa";
import Select from "react-select";
import { useEffect, useState } from "react";
import { isValidUuid, useAccount, useApiClient } from "common-ui";
import { useRouter } from "next/router";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

export interface ReindexApiConfig {
  /** Display name of the module. */
  moduleName: string;

  /** API path used to build the index-refresh endpoint (e.g. "collection-api"). */
  apiEndpoint: string;

  /** Document types supported by the module's index-refresh endpoint. */
  documentTypes: string[];
}

/**
 * Reindex Configuration:
 *
 * To support reindexing for a new module or document type, add it to this array. The module must
 * expose the "index-refresh" endpoint and the document type must be supported by the module's
 * IndexRefreshService.
 *
 * Potentially this could be changed to be retrieved via an API call to dynamically fetch the
 * available reindex configurations.
 */
export const REINDEX_API_CONFIG: ReindexApiConfig[] = [
  {
    moduleName: "Collection API",
    apiEndpoint: "collection-api",
    documentTypes: [
      "material-sample",
      "collecting-event",
      "storage-unit",
      "project",
      "transaction"
    ]
  },
  {
    moduleName: "Object Store API",
    apiEndpoint: "objectstore-api",
    documentTypes: ["metadata"]
  },
  {
    moduleName: "Agent API",
    apiEndpoint: "agent-api",
    documentTypes: ["person"]
  }
];

type ReindexScope = "all" | "single";

interface ReindexSubmission {
  moduleName: string;
  docType: string;
  documentId?: string;
  submittedAt: Date;
  success: boolean;
  errorMessage?: string;
}

const DEFAULT_API = REINDEX_API_CONFIG[0];

export function ReindexPage() {
  const { isAdmin } = useAccount();
  const { apiClient } = useApiClient();
  const { formatMessage, locale } = useDinaIntl();
  const router = useRouter();

  const [selectedApi, setSelectedApi] = useState<ReindexApiConfig>(DEFAULT_API);
  const [docType, setDocType] = useState(DEFAULT_API.documentTypes[0]);
  const [scope, setScope] = useState<ReindexScope>("all");
  const [documentId, setDocumentId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<ReindexSubmission[]>([]);

  // Ensure the user is admin before allowing access to the page.
  useEffect(() => {
    if (!isAdmin) {
      // Route to homepage...
      router.push("/");
    }
  }, [isAdmin, router]);
  if (!isAdmin) {
    return null;
  }

  const trimmedDocumentId = documentId.trim();
  const isDocumentIdValid = isValidUuid(trimmedDocumentId);
  const canSubmit = !submitting && (scope === "all" || isDocumentIdValid);
  const endpoint = `${selectedApi.apiEndpoint}/index-refresh`;

  function onApiChange(apiEndpoint?: string) {
    const api =
      REINDEX_API_CONFIG.find((config) => config.apiEndpoint === apiEndpoint) ??
      DEFAULT_API;
    setSelectedApi(api);
    setDocType(api.documentTypes[0]);
  }

  function reset() {
    setSelectedApi(DEFAULT_API);
    setDocType(DEFAULT_API.documentTypes[0]);
    setScope("all");
    setDocumentId("");
  }

  async function submit() {
    const singleDocumentId = scope === "single" ? trimmedDocumentId : undefined;
    const submission: ReindexSubmission = {
      moduleName: selectedApi.moduleName,
      docType,
      documentId: singleDocumentId,
      submittedAt: new Date(),
      success: true
    };

    setSubmitting(true);
    try {
      await apiClient.axios.post(
        endpoint,
        {
          data: {
            type: "index-refresh",
            ...(singleDocumentId && { id: singleDocumentId }),
            attributes: { docType }
          }
        },
        { headers: { "Content-Type": "application/vnd.api+json" } }
      );
    } catch (error) {
      submission.success = false;
      submission.errorMessage = error?.response?.status
        ? `${error.response.status} ${error.response.statusText ?? ""}`.trim()
        : error?.message;
    } finally {
      setSubmissions((current) => [submission, ...current]);
      setSubmitting(false);
    }
  }

  const apiOptions = REINDEX_API_CONFIG.map((config) => ({
    label: config.moduleName,
    value: config.apiEndpoint
  }));
  const docTypeOptions = selectedApi.documentTypes.map((type) => ({
    label: type,
    value: type
  }));
  const selectStyles = {
    menuPortal: (base) => ({ ...base, zIndex: 9999 })
  };

  return (
    <PageLayout
      titleId="reindexDocumentsTitle"
      headingTooltip={{ id: "reindexDocumentsTooltip", placement: "right" }}
    >
      {/* The global stylesheet forces blue text on outline-secondary buttons, keep the reset button gray. */}
      <style>{`
        .btn.reindex-reset-button {
          color: #5c636a;
          border-color: #5c636a;
        }
        .btn.reindex-reset-button:hover,
        .btn.reindex-reset-button:focus,
        .btn.reindex-reset-button:active {
          color: #fff;
          background-color: #5c636a;
          border-color: #5c636a;
        }
      `}</style>
      <Row>
        <Col md={7}>
          <Card className="mb-3">
            <Card.Body>
              <Row className="mb-3">
                <Col sm={6}>
                  <label htmlFor="reindex-api-select" className="fw-bold mb-1">
                    <DinaMessage id="reindexApi" />
                  </label>
                  <Select
                    inputId="reindex-api-select"
                    value={apiOptions.find(
                      (option) => option.value === selectedApi.apiEndpoint
                    )}
                    onChange={(option) => onApiChange(option?.value)}
                    options={apiOptions}
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                  />
                </Col>
                <Col sm={6}>
                  <label htmlFor="reindex-type-select" className="fw-bold mb-1">
                    <DinaMessage id="type" />
                  </label>
                  <Select
                    inputId="reindex-type-select"
                    value={docTypeOptions.find(
                      (option) => option.value === docType
                    )}
                    onChange={(option) =>
                      setDocType(option?.value ?? selectedApi.documentTypes[0])
                    }
                    options={docTypeOptions}
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                  />
                </Col>
              </Row>

              <fieldset className="mb-3">
                <legend className="fs-6 fw-bold mb-2">
                  <DinaMessage id="reindexScope" />
                </legend>
                <Form.Check
                  type="radio"
                  id="reindex-scope-all"
                  name="reindex-scope"
                  label={formatMessage("reindexScopeAll")}
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                />
                <Form.Check
                  type="radio"
                  id="reindex-scope-single"
                  name="reindex-scope"
                  label={formatMessage("reindexScopeSingle")}
                  checked={scope === "single"}
                  onChange={() => setScope("single")}
                />
              </fieldset>

              {scope === "all" ? (
                <Alert variant="warning" className="d-flex gap-2">
                  <FaExclamationTriangle className="mt-1 flex-shrink-0" />
                  <span>
                    <DinaMessage id="reindexAllWarning" />
                  </span>
                </Alert>
              ) : (
                <Form.Group controlId="reindex-document-id" className="mb-3">
                  <Form.Label className="fw-bold">
                    <DinaMessage id="reindexDocumentId" />
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="00000000-0000-0000-0000-000000000000"
                    value={documentId}
                    onChange={(event) => setDocumentId(event.target.value)}
                    isInvalid={trimmedDocumentId !== "" && !isDocumentIdValid}
                  />
                  <Form.Control.Feedback type="invalid">
                    <DinaMessage id="reindexInvalidUuid" />
                  </Form.Control.Feedback>
                </Form.Group>
              )}

              <hr />
              <div className="d-flex justify-content-end gap-2">
                <Button
                  variant="outline-secondary"
                  className="reindex-reset-button"
                  onClick={reset}
                  disabled={submitting}
                >
                  <FaUndo className="me-2" />
                  <DinaMessage id="resetButtonText" />
                </Button>
                <Button
                  variant="primary"
                  onClick={submit}
                  disabled={!canSubmit}
                >
                  <FaSyncAlt className="me-2" />
                  <DinaMessage
                    id={
                      scope === "all"
                        ? "reindexAllButton"
                        : "reindexDocumentButton"
                    }
                  />
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={5}>
          <Card className="mb-3">
            <Card.Header className="small fw-bold text-uppercase text-muted">
              <DinaMessage id="reindexRequest" />
            </Card.Header>
            <Card.Body>
              <dl className="row mb-0 small">
                <dt className="col-4 fw-normal text-muted">
                  <DinaMessage id="systemInfoEndpoint" />
                </dt>
                <dd className="col-8">
                  <code>POST /api/{endpoint}</code>
                </dd>
                <dt className="col-4 fw-normal text-muted">
                  <DinaMessage id="type" />
                </dt>
                <dd className="col-8">
                  <code>{docType}</code>
                </dd>
                <dt className="col-4 fw-normal text-muted">
                  <DinaMessage id="reindexDocument" />
                </dt>
                <dd className="col-8 mb-0 text-break">
                  {scope === "all" ? (
                    <DinaMessage id="reindexAllDocuments" />
                  ) : (
                    <code>{trimmedDocumentId || "-"}</code>
                  )}
                </dd>
              </dl>
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Header className="small fw-bold text-uppercase text-muted">
              <DinaMessage id="reindexSubmittedThisSession" />
            </Card.Header>
            {submissions.length === 0 ? (
              <Card.Body className="small text-muted">
                <DinaMessage id="reindexNoSubmissions" />
              </Card.Body>
            ) : (
              <ul className="list-group list-group-flush">
                {submissions.map((submission, index) => (
                  <li
                    key={index}
                    className="list-group-item d-flex justify-content-between align-items-start gap-2 small"
                  >
                    <div className="text-break">
                      <div>
                        <code>{submission.docType}</code>
                        {" · "}
                        {submission.documentId ?? (
                          <span className="text-lowercase">
                            <DinaMessage id="reindexAllDocuments" />
                          </span>
                        )}
                      </div>
                      <div className="text-muted">
                        {submission.moduleName} ·{" "}
                        {submission.submittedAt.toLocaleString(locale)}
                        {submission.errorMessage &&
                          ` · ${submission.errorMessage}`}
                      </div>
                    </div>
                    <Badge bg={submission.success ? "success" : "danger"}>
                      <DinaMessage
                        id={
                          submission.success
                            ? "reindexAccepted"
                            : "reindexFailed"
                        }
                      />
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Col>
      </Row>
    </PageLayout>
  );
}

export default ReindexPage;

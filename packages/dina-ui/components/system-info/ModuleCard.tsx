import { ApiModule, ModuleStatus } from "../../types/system-info/SystemInfo";
import { Badge, Button, Collapse } from "react-bootstrap";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaStopwatch,
  FaChevronDown,
  FaChevronUp
} from "react-icons/fa";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { useState } from "react";

const STATUS_CONFIG: Record<
  ModuleStatus,
  {
    labelKey: "systemInfoStatusOnline" | "systemInfoStatusOffline";
    badgeBg: string;
    borderColor: string;
    headerBg: string;
    icon: React.JSX.Element;
  }
> = {
  online: {
    labelKey: "systemInfoStatusOnline",
    badgeBg: "success",
    borderColor: "#198754",
    headerBg: "#d1e7dd",
    icon: <FaCheckCircle />
  },
  offline: {
    labelKey: "systemInfoStatusOffline",
    badgeBg: "danger",
    borderColor: "#dc3545",
    headerBg: "#f8d7da",
    icon: <FaTimesCircle />
  }
};

/** Latency thresholds (in ms) used to color the latency value. */
function latencyTextClass(latencyMs: number) {
  return latencyMs < 500
    ? "text-success"
    : latencyMs < 2000
    ? "text-warning"
    : "text-danger";
}

function MicroLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-muted text-uppercase" style={{ fontSize: "0.7rem" }}>
      {children}
    </div>
  );
}

function EnabledBadge({ enabled }: { enabled?: boolean }) {
  // If undefined, we don't know if it's enabled or disabled, so show "Unknown" badge.
  if (enabled === undefined) {
    return (
      <Badge bg="warning" text="dark" className="fw-normal">
        <DinaMessage id="systemInfoUnknown" />
      </Badge>
    );
  }

  return enabled ? (
    <Badge bg="success" className="fw-normal">
      <DinaMessage id="systemInfoEnabled" />
    </Badge>
  ) : (
    <Badge bg="secondary" className="fw-normal">
      <DinaMessage id="systemInfoDisabled" />
    </Badge>
  );
}

/**
 * Render standard scalar values cleanly
 */
function ScalarValue({ value }: { value: unknown }) {
  if (typeof value === "boolean") {
    return <EnabledBadge enabled={value} />;
  }
  return <code>{String(value)}</code>;
}

/**
 * Specialized card for Elasticsearch/Search index objects
 */
function IndexCard({
  name,
  data
}: {
  name: string;
  data: { online?: boolean; schemaVersion?: string };
}) {
  return (
    <div className="p-2 border rounded bg-white shadow-sm d-flex align-items-center justify-content-between gap-2">
      <div className="lh-sm">
        <code className="fw-bold text-dark" style={{ fontSize: "0.8rem" }}>
          {name}
        </code>
        {data.schemaVersion && (
          <div className="text-muted mt-1" style={{ fontSize: "0.75rem" }}>
            <DinaMessage id="field_version" />:{" "}
            <code>v{data.schemaVersion}</code>
          </div>
        )}
      </div>
      {data.online !== undefined && (
        <Badge
          bg={data.online ? "success" : "danger"}
          className="d-inline-flex align-items-center gap-1 fw-normal flex-shrink-0"
        >
          {data.online ? <FaCheckCircle /> : <FaTimesCircle />}
          <DinaMessage
            id={
              data.online ? "systemInfoStatusOnline" : "systemInfoStatusOffline"
            }
          />
        </Badge>
      )}
    </div>
  );
}

/**
 * Main Module Info renderer
 */
export function ModuleInfoSection({
  moduleInfo
}: {
  moduleInfo: Map<string, any>;
}) {
  // Check if any indicies have an issue, if so it should be automatically expanded.
  const hasNestedIssue = Array.from(moduleInfo.values()).some((value) => {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return Object.values(value).some(
        (subValue: any) => subValue?.online === false
      );
    }
    return false;
  });

  const [indicesOpen, setIndicesOpen] = useState(hasNestedIssue);

  return (
    <div className="pt-2 d-flex flex-column gap-2">
      <MicroLabel>
        <DinaMessage id="systemInfoModuleInfo" />
      </MicroLabel>

      {Array.from(moduleInfo.entries()).map(([key, value]) => {
        // If the value is a complex nested object (e.g., indices)
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          const entryCount = Object.keys(value).length;
          return (
            <div key={key} className="border rounded bg-light p-2">
              {/* Collapsible header toggle for nested structures (e.g., indices) */}
              <Button
                variant="light"
                size="sm"
                className="d-flex align-items-center justify-content-between w-100 border-0 bg-transparent p-0 shadow-none text-start"
                onClick={() => setIndicesOpen((prev) => !prev)}
                aria-expanded={indicesOpen}
              >
                <div
                  className="fw-bold text-muted text-uppercase"
                  style={{ fontSize: "0.7rem" }}
                >
                  {key} ({entryCount})
                </div>

                <span className="d-flex align-items-center gap-1 text-primary small">
                  {indicesOpen ? (
                    <FaChevronUp size={10} />
                  ) : (
                    <FaChevronDown size={10} />
                  )}
                </span>
              </Button>

              {/* Collapsible content container containing IndexCard items */}
              <Collapse in={indicesOpen}>
                <div>
                  <div className="d-flex flex-column gap-2 pt-2">
                    {Object.entries(value).map(([subKey, subValue]) => {
                      // Index shape check
                      if (typeof subValue === "object" && subValue !== null) {
                        return (
                          <IndexCard
                            key={subKey}
                            name={subKey}
                            data={subValue as any}
                          />
                        );
                      }

                      // Fallback for simple nested key-values
                      return (
                        <div
                          key={subKey}
                          className="d-flex justify-content-between align-items-center small"
                        >
                          <span className="text-muted">{subKey}:</span>
                          <ScalarValue value={subValue} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Collapse>
            </div>
          );
        }

        // Standard top-level scalar property row
        return (
          <div
            key={key}
            className="d-flex justify-content-between align-items-center border-bottom pb-1 small"
          >
            <span className="fw-semibold text-muted">{key}</span>
            <ScalarValue value={value} />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Used to display each module's status and info on the System Info page.
 * The card's styling and content will adapt based on the module's status and available info.
 *
 * Layout is AI assisted.
 */
export function ModuleCard({ module }: { module: ApiModule }) {
  const cfg = STATUS_CONFIG[module.status];

  const hasModuleInfo = module.moduleInfo && module.moduleInfo.size > 0;

  return (
    <div
      className="card h-100 shadow-sm"
      style={{ borderTop: `4px solid ${cfg.borderColor}` }}
    >
      {/* Card Header */}
      <div
        className="card-header d-flex align-items-center justify-content-between py-2 px-3"
        style={{ background: cfg.headerBg }}
      >
        <div className="d-flex align-items-center gap-2">
          <span className="fw-semibold">{module.apiConfig.moduleName}</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Badge
            bg={cfg.badgeBg}
            className="d-inline-flex align-items-center gap-1"
          >
            {cfg.icon} <DinaMessage id={cfg.labelKey} />
          </Badge>
        </div>
      </div>

      {/* Card Body */}
      <div className="card-body px-3 py-2 d-flex flex-column gap-2">
        {/* Attention required badge */}
        {module.attentionRequired && (
          <Badge
            bg="warning"
            text="dark"
            className="d-inline-flex align-items-center gap-1"
          >
            <FaExclamationCircle size={10} />{" "}
            <DinaMessage id="systemInfoAttentionRequired" />
          </Badge>
        )}

        {/* Error message */}
        {module.errorMessage && (
          <div className="alert alert-danger d-flex align-items-start gap-2 py-2 px-2 mb-0 small">
            <FaExclamationTriangle className="mt-1 flex-shrink-0" size={12} />
            <div>
              {(module.errorStatus || module.errorStatusText) && (
                <div className="fw-bold">
                  {module.errorStatus} {module.errorStatusText}
                </div>
              )}
              {module.errorMessage}
            </div>
          </div>
        )}

        {/* Version + Latency + Endpoint */}
        <div className="d-flex flex-wrap gap-3">
          <div>
            <MicroLabel>
              <DinaMessage id="field_version" />
            </MicroLabel>
            <code className="small">
              {module.moduleVersion ?? <DinaMessage id="systemInfoUnknown" />}
            </code>
          </div>
          {module.latencyMs !== undefined && (
            <div>
              <MicroLabel>
                <DinaMessage id="systemInfoLatency" />
              </MicroLabel>
              <span
                className={
                  "small fw-semibold d-inline-flex align-items-center gap-1 " +
                  latencyTextClass(module.latencyMs!)
                }
              >
                <FaStopwatch size={11} />
                <DinaMessage
                  id="systemInfoLatencyMs"
                  values={{ latencyMs: module.latencyMs }}
                />
              </span>
            </div>
          )}
          <div className="flex-grow-1">
            <MicroLabel>
              <DinaMessage id="systemInfoEndpoint" />
            </MicroLabel>
            <div className="d-flex align-items-center gap-1">
              <code className="small text-break">
                <>
                  {"/api/"}
                  {module.apiConfig.apiEndpoint}
                  {"/"}
                </>
              </code>
            </div>
          </div>
        </div>

        <hr className="my-1" />

        {/* Message producer / consumer */}
        <div className="d-flex flex-wrap gap-3">
          <div>
            <MicroLabel>
              <DinaMessage id="systemInfoMessageProducer" />
            </MicroLabel>
            <div className="d-flex align-items-center gap-1 mt-1">
              <EnabledBadge enabled={module.messageProducerEnabled} />
            </div>
          </div>
          <div>
            <MicroLabel>
              <DinaMessage id="systemInfoMessageConsumer" />
            </MicroLabel>
            <div className="d-flex align-items-center gap-1 mt-1">
              <EnabledBadge enabled={module.messageConsumerEnabled} />
            </div>
          </div>
        </div>

        {/* Module info — only rendered when extra info exists */}
        {hasModuleInfo && <ModuleInfoSection moduleInfo={module.moduleInfo!} />}
      </div>
    </div>
  );
}

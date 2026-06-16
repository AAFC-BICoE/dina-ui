import { ApiModule, ModuleStatus } from "../../types/system-info/SystemInfo";
import { Badge } from "react-bootstrap";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaExclamationCircle
} from "react-icons/fa";

import type { JSX } from "react";

const STATUS_CONFIG: Record<
  ModuleStatus,
  {
    label: string;
    badgeBg: string;
    borderColor: string;
    headerBg: string;
    icon: JSX.Element;
  }
> = {
  online: {
    label: "Online",
    badgeBg: "success",
    borderColor: "#198754",
    headerBg: "#d1e7dd",
    icon: <FaCheckCircle />
  },
  offline: {
    label: "Offline",
    badgeBg: "danger",
    borderColor: "#dc3545",
    headerBg: "#f8d7da",
    icon: <FaTimesCircle />
  }
};

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
        Unknown
      </Badge>
    );
  }

  return enabled ? (
    <Badge bg="success" className="fw-normal">
      Enabled
    </Badge>
  ) : (
    <Badge bg="secondary" className="fw-normal">
      Disabled
    </Badge>
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
            {cfg.icon} {cfg.label}
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
            <FaExclamationCircle size={10} /> Attention Required
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

        {/* Version + Endpoint */}
        <div className="d-flex flex-wrap gap-3">
          <div>
            <MicroLabel>Version</MicroLabel>
            <code className="small">{module.moduleVersion}</code>
          </div>
          <div className="flex-grow-1">
            <MicroLabel>Endpoint</MicroLabel>
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
            <MicroLabel>Message Producer</MicroLabel>
            <div className="d-flex align-items-center gap-1 mt-1">
              <EnabledBadge enabled={module.messageProducerEnabled} />
            </div>
          </div>
          <div>
            <MicroLabel>Message Consumer</MicroLabel>
            <div className="d-flex align-items-center gap-1 mt-1">
              <EnabledBadge enabled={module.messageConsumerEnabled} />
            </div>
          </div>
        </div>

        {/* Module info — only rendered when extra info exists */}
        {hasModuleInfo && (
          <div className="pt-2">
            <MicroLabel>Module Info</MicroLabel>
            <table className="table table-sm table-bordered mb-0 small">
              <tbody>
                {Array.from(module.moduleInfo!.entries()).map(
                  ([key, value]) => (
                    <tr key={key}>
                      <td
                        className="fw-semibold text-muted bg-light text-nowrap"
                        style={{ width: "40%" }}
                      >
                        {key}
                      </td>
                      <td>
                        {typeof value === "boolean" ? (
                          <EnabledBadge enabled={value} />
                        ) : (
                          String(value)
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

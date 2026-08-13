import PageLayout from "../../components/page/PageLayout";
import { ApiConfigInfo } from "../../types/system-info/SystemInfo";
import { FaSyncAlt } from "react-icons/fa";
import { ModuleCard } from "../../components/system-info/ModuleCard";
import { useSystemInfoCheck } from "../../components/system-info/useSystemInfoCheck";
import { Button } from "react-bootstrap";
import moment from "moment";
import { useEffect, useState } from "react";
import { useAccount } from "common-ui";
import { useRouter } from "next/router";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

/**
 * System Info Configuration:
 *
 * To add a new module to the System Info page, simply add a new entry to the SYSTEM_INFO_API_CONFIG
 * array with the module's name and API endpoint. The useSystemInfoCheck hook will automatically
 * fetch the module's info and status based on the provided API endpoint.
 */
const SYSTEM_INFO_API_CONFIG: ApiConfigInfo[] = [
  {
    moduleName: "Collection API",
    apiEndpoint: "collection-api"
  },
  {
    moduleName: "User API",
    apiEndpoint: "user-api"
  },
  {
    moduleName: "Object Store API",
    apiEndpoint: "objectstore-api"
  },
  {
    moduleName: "SeqDB API",
    apiEndpoint: "seqdb-api"
  },
  {
    moduleName: "Agent API",
    apiEndpoint: "agent-api"
  },
  {
    moduleName: "Loan Transaction API",
    apiEndpoint: "loan-transaction-api"
  },
  {
    moduleName: "Export API",
    apiEndpoint: "dina-export-api"
  },
  {
    moduleName: "Search WS API",
    apiEndpoint: "search-api"
  }
];

/**
 * Localized "X seconds ago" style text for the last refreshed time. Uses second-level
 * precision so the text visibly ticks between refreshes without making any API requests.
 */
function formatRelativeTime(date: Date, locale: string) {
  const relativeTimeFormat = new Intl.RelativeTimeFormat(locale, {
    numeric: "always"
  });
  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );
  if (elapsedSeconds < 60) {
    return relativeTimeFormat.format(-elapsedSeconds, "second");
  }
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return relativeTimeFormat.format(-elapsedMinutes, "minute");
  }
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return relativeTimeFormat.format(-elapsedHours, "hour");
  }
  return relativeTimeFormat.format(-Math.floor(elapsedHours / 24), "day");
}

export function SystemInfo() {
  const { isAdmin } = useAccount();
  const { locale } = useDinaIntl();
  const router = useRouter();

  // The useSystemInfoCheck hook handles fetching the status and info for all modules defined in the config.
  const { modules, lastRefreshed, refresh, loading } = useSystemInfoCheck(
    SYSTEM_INFO_API_CONFIG
  );

  // Re-render this component every second so the relative "Last refreshed" time keeps
  // ticking. This is not doing API requests every second - the API requests are only made
  // when the "Refresh" button is clicked.
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

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

  // Button to refresh the status of all modules
  const buttonBar = (
    <>
      <Button
        variant="primary"
        className="ms-auto me-3"
        onClick={() => refresh()}
        style={{ width: "10rem" }}
        disabled={loading}
      >
        <FaSyncAlt className={"me-2 " + (loading ? "spin-slow" : "")} />
        <DinaMessage id="refreshButtonText" />
      </Button>
    </>
  );

  return (
    <PageLayout titleId="systemInfoTitle" buttonBarContent={buttonBar}>
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .spin-slow {
          animation: spin-slow 2s linear infinite;
        }
      `}</style>

      <div className="system-info-page">
        {loading && modules.length === 0 ? (
          // Only show the fetching indicator on the initial load. On subsequent refreshes
          // the cards stay visible so the latency values can be watched as they change.
          <div className="d-flex align-items-center gap-2 text-muted small mb-3">
            <FaSyncAlt size={12} className="spin-slow" />
            <DinaMessage id="systemInfoFetching" />
          </div>
        ) : (
          <>
            {/* Last refreshed */}
            {lastRefreshed && (
              <div className="d-flex align-items-center gap-2 text-muted small mb-3">
                <FaSyncAlt size={12} className={loading ? "spin-slow" : ""} />
                <DinaMessage id="systemInfoLastRefreshed" />{" "}
                <strong>
                  {formatRelativeTime(lastRefreshed, locale)} (
                  {moment(lastRefreshed).format("YYYY-MM-DD HH:mm:ss")})
                </strong>
              </div>
            )}

            {/* Module cards grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "1.25rem"
              }}
            >
              {modules.map((module) => (
                <ModuleCard key={module.apiConfig.moduleName} module={module} />
              ))}
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}

export default SystemInfo;

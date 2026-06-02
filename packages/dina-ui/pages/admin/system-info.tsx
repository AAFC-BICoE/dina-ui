import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { ApiConfigInfo } from "packages/dina-ui/types/system-info/SystemInfo";
import { FaSyncAlt } from "react-icons/fa";
import { ModuleCard } from "../../components/system-info/ModuleCard";
import { useSystemInfoCheck } from "../../components/system-info/useSystemInfoCheck";
import { Button } from "react-bootstrap";
import moment from "moment";
import { useEffect, useState } from "react";
import { useAccount } from "common-ui";
import { useRouter } from "next/router";

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

export function SystemInfo() {
  const { isAdmin } = useAccount();
  const router = useRouter();

  // Ensure the user is admin before allowing access to the page.
  if (!isAdmin) {
    // Route to homepage...
    router.push("/");
  }

  // The useSystemInfoCheck hook handles fetching the status and info for all modules defined in the config.
  const { modules, lastRefreshed, refresh, loading } = useSystemInfoCheck(
    SYSTEM_INFO_API_CONFIG
  );

  // Force react refresh this component every 10 seconds to keep the module statuses up to date.
  // This is not doing API requests every 10 seconds - the API requests are only made when the
  // "Refresh" button is clicked.
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 10000);
    return () => clearInterval(interval);
  }, []);

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
        Refresh
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
        {loading ? (
          <div className="d-flex align-items-center gap-2 text-muted small mb-3">
            <FaSyncAlt size={12} className="spin-slow" />
            Fetching system info...
          </div>
        ) : (
          <>
            {/* Last refreshed */}
            {lastRefreshed && (
              <div className="d-flex align-items-center gap-2 text-muted small mb-3">
                <FaSyncAlt size={12} />
                Last refreshed:{" "}
                <strong>
                  {moment(lastRefreshed).fromNow()} (
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

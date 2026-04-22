import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { ApiConfigInfo } from "packages/dina-ui/types/system-info/SystemInfo";
import { FaSyncAlt } from "react-icons/fa";
import { ModuleCard } from "../../components/system-info/ModuleCard";
import { useSystemInfoCheck } from "../../components/system-info/useSystemInfoCheck";
import { Button } from "react-bootstrap";
import moment from "moment";

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
    moduleName: "DINA User API",
    apiEndpoint: "user-api"
  },
  {
    moduleName: "Object Store API",
    apiEndpoint: "objectstore-api"
  }
];

export function SystemInfo() {
  // The useSystemInfoCheck hook handles fetching the status and info for all modules defined in the config.
  const { modules, lastRefreshed, refresh, loading } = useSystemInfoCheck(
    SYSTEM_INFO_API_CONFIG
  );

  // Button to refresh the status of all modules
  const buttonBar = (
    <>
      <Button
        variant="primary"
        className="ms-auto"
        onClick={() => refresh()}
        style={{ width: "10rem" }}
        disabled={loading}
      >
        <FaSyncAlt className="me-2" />
        Refresh
      </Button>
    </>
  );

  return (
    <PageLayout titleId="systemInfoTitle" buttonBarContent={buttonBar}>
      <div className="system-info-page">
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
      </div>
    </PageLayout>
  );
}

export default SystemInfo;

import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { ApiModule } from "packages/dina-ui/types/system-info/SystemInfo";
import { FaSyncAlt } from "react-icons/fa";
import { ModuleCard } from "../../components/system-info/ModuleCard";

export function SystemInfo() {
  const MOCK_MODULES: ApiModule[] = [
    {
      moduleVersion: "2.1.0",
      status: "online",
      apiConfig: {
        moduleName: "Collection API",
        apiEndpoint: "collection-api"
      },
      messageProducerEnabled: true,
      messageConsumerEnabled: true,
      attentionRequired: false
    },
    {
      moduleVersion: "1.2.5",
      status: "online",
      apiConfig: {
        moduleName: "DINA User API",
        apiEndpoint: "user-api"
      },
      messageProducerEnabled: false,
      messageConsumerEnabled: false,
      attentionRequired: false
    },
    {
      moduleVersion: "3.0.1",
      status: "offline",
      apiConfig: {
        moduleName: "Object Store API",
        apiEndpoint: "objectstore-api"
      },
      messageProducerEnabled: true,
      messageConsumerEnabled: false,
      attentionRequired: true,
      moduleInfo: new Map<string, any>([["imageMagick", true]]),
      errorMessage:
        "Connection refused: Unable to reach the service. The host may be down or unreachable."
    }
  ];

  const PAGE_LAST_REFRESHED = new Date("2026-04-22T10:30:05Z");

  return (
    <PageLayout titleId="systemInfoTitle">
      <div className="system-info-page">
        {/* Last refreshed */}
        <div className="d-flex align-items-center gap-2 text-muted small mb-3">
          <FaSyncAlt size={12} />
          Last refreshed:{" "}
          <strong>
            {PAGE_LAST_REFRESHED.toLocaleDateString()}{" "}
            {PAGE_LAST_REFRESHED.toLocaleTimeString()}
          </strong>
        </div>

        {/* Module cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1.25rem"
          }}
        >
          {MOCK_MODULES.map((module) => (
            <ModuleCard key={module.apiConfig.moduleName} module={module} />
          ))}
        </div>
      </div>
    </PageLayout>
  );
}

export default SystemInfo;

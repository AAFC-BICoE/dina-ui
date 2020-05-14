import { ListPageLayout } from "common-ui";
import { Head, Nav } from "../components";
import { AgentMessage, useAgentIntl } from "../intl/agent-intl";

const AGENT_FILTER_ATTRIBUTES = ["displayName", "email"];
const AGENT_TABLE_COLUMNS = ["displayName", "email"];

export default function AgentHomePage() {
  const { formatMessage } = useAgentIntl();

  return (
    <div>
      <Head title={formatMessage("appTitle")} />
      <Nav />

      <div className="container-fluid">
        <h1>
          <AgentMessage id="appTitle" />
        </h1>
        <ListPageLayout
          filterAttributes={AGENT_FILTER_ATTRIBUTES}
          id="agent-list"
          queryTableProps={{
            columns: AGENT_TABLE_COLUMNS,
            path: "agent"
          }}
        />
      </div>
    </div>
  );
}

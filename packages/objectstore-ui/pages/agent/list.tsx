import { ListPageLayout } from "common-ui";
import { Head, Nav, withAgentApi } from "../../components";
import {
  ObjectStoreMessage,
  useObjectStoreIntl
} from "../../intl/objectstore-intl";

const AGENT_FILTER_ATTRIBUTES = ["displayName", "email"];
const AGENT_TABLE_COLUMNS = ["displayName", "email"];

export default withAgentApi(function AgentListPage() {
  const { formatMessage } = useObjectStoreIntl();

  return (
    <div>
      <Head title={formatMessage("agentListTitle")} />
      <Nav />

      <div className="container-fluid">
        <h1>
          <ObjectStoreMessage id="agentListTitle" />
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
});

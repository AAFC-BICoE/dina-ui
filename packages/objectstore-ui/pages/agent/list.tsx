import { ButtonBar, CreateButton, ListPageLayout } from "common-ui";
import Link from "next/link";
import { Head, Nav, withAgentApi } from "../../components";
import {
  ObjectStoreMessage,
  useObjectStoreIntl
} from "../../intl/objectstore-intl";

const AGENT_FILTER_ATTRIBUTES = ["displayName", "email"];
const AGENT_TABLE_COLUMNS = [
  {
    Cell: ({ original: { id, displayName } }) => (
      <Link href={`/agent/view?id=${id}`}>
        <a>{displayName}</a>
      </Link>
    ),
    Header: "Display Name",
    accessor: "displayName"
  },
  {
    Header: "Email",
    accessor: "email"
  }
];

export default function AgentListPage() {
  const { formatMessage } = useObjectStoreIntl();

  return (
    <div>
      <Head title={formatMessage("agentListTitle")} />
      <Nav />
      <ButtonBar>
        <CreateButton entityLink="agent" />
      </ButtonBar>
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
};

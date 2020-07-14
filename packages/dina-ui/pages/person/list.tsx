import { ButtonBar, CreateButton, ListPageLayout } from "common-ui";
import Link from "next/link";
import { Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

const AGENT_FILTER_ATTRIBUTES = ["displayName", "email", "createdBy"];
const AGENT_TABLE_COLUMNS = [
  {
    Cell: ({ original: { id, displayName } }) => (
      <Link href={`/person/view?id=${id}`}>
        <a>{displayName}</a>
      </Link>
    ),
    accessor: "displayName"
  },
  "email",
  "createdBy",
  "createdOn"
];

export default function AgentListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("personListTitle")} />
      <Nav />
      <ButtonBar>
        <CreateButton entityLink="/person" />
      </ButtonBar>
      <div className="container-fluid">
        <h1>
          <DinaMessage id="personListTitle" />
        </h1>
        <ListPageLayout
          filterAttributes={AGENT_FILTER_ATTRIBUTES}
          id="person-list"
          queryTableProps={{
            columns: AGENT_TABLE_COLUMNS,
            path: "agent-api/person"
          }}
        />
      </div>
    </div>
  );
}

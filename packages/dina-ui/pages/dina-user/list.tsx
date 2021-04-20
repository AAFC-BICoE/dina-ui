import { dateCell, ListPageLayout, stringArrayCell } from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

const USER_TABLE_COLUMNS = [
  {
    Cell: ({ original: { id, username } }) => (
      <Link href={`/dina-user/view?id=${id}`}>{username}</Link>
    ),
    accessor: "username"
  },
  "firstName",
  "lastName",
  {
    Cell: ({ original: { agent } }) =>
      agent?.id ? (
        <Link href={`/person/view?id=${agent.id}`}>{agent.displayName}</Link>
      ) : null,
    accessor: "agent.displayName",
    sortable: false
  },
  { ...stringArrayCell("groups"), sortable: false },
  { ...stringArrayCell("roles"), sortable: false },
  dateCell("createdOn")
];

export default function AgentListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("userListTitle")} />
      <Nav />
      <div className="container-fluid">
        <h1>
          <DinaMessage id="userListTitle" />
        </h1>
        <ListPageLayout
          id="user-list"
          queryTableProps={{
            columns: USER_TABLE_COLUMNS,
            path: "user-api/user",
            joinSpecs: [
              {
                apiBaseUrl: "/agent-api",
                idField: "agentId",
                joinField: "agent",
                path: user => `person/${user.agentId}`
              }
            ]
          }}
        />
      </div>
      <Footer />
    </div>
  );
}

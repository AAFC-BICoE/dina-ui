import { dateCell, ListPageLayout, stringArrayCell } from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { RolesPerGroupTable } from "./view";

const USER_TABLE_COLUMNS = [
  {
    Cell: ({ original: { id, username } }) => (
      <Link href={`/dina-user/view?id=${id}`}>{username}</Link>
    ),
    accessor: "username"
  },
  {
    Cell: ({ original: { agent } }) =>
      agent?.id ? (
        <Link href={`/person/view?id=${agent.id}`}>{agent.displayName}</Link>
      ) : null,
    accessor: "agent.displayName",
    sortable: false
  },
  {
    Cell: ({ original: { rolesPerGroup } }) => (
      <RolesPerGroupTable
        rolesPerGroup={rolesPerGroup}
        hideTitle={true}
        hideTable={
          !Object.keys(rolesPerGroup) || Object.keys(rolesPerGroup).length === 0
        }
      />
    ),
    accessor: "rolesPerGroup"
  }
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

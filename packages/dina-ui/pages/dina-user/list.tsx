import { ColumnDefinition, ListPageLayout } from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { RolesPerGroupTable } from "./view";

const USER_TABLE_COLUMNS: ColumnDefinition<any>[] = [
  {
    cell: ({
      row: {
        original: { id, username }
      }
    }) => <Link href={`/dina-user/view?id=${id}`}>{username}</Link>,
    accessorKey: "username"
  },
  {
    cell: ({
      row: {
        original: { agent }
      }
    }) =>
      agent?.id ? (
        <Link href={`/person/view?id=${agent.id}`}>{agent.displayName}</Link>
      ) : null,
    accessorKey: "agent.displayName",
    enableSorting: false
  },
  {
    cell: ({
      row: {
        original: { rolesPerGroup }
      }
    }) => (
      <RolesPerGroupTable
        rolesPerGroup={rolesPerGroup}
        hideTitle={true}
        hideTable={
          !Object.keys(rolesPerGroup) || Object.keys(rolesPerGroup).length === 0
        }
      />
    ),
    accessorKey: "rolesPerGroup",
    enableSorting: false
  }
];

export default function AgentListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("userListTitle")} />
      <Nav />

      <main className="container-fluid" role="main">
        <h1 id="wb-cont">
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
                path: (user) => `person/${user.agentId}`
              }
            ]
          }}
          defaultSort={[{ id: "username", desc: false }]}
        />
      </main>
      <Footer />
    </div>
  );
}

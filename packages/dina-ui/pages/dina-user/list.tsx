import { ColumnDefinition, ListPageLayout } from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Person } from "../../types/objectstore-api";
import { DinaUser } from "../../types/user-api/resources/DinaUser";
import { RolesPerGroupTable } from "./view";

/* DinaUser with the Person record joined in client-side. */
type DinaUserWithAgent = DinaUser & { agent?: Person };

const DEFAULT_SORT = [{ id: "username", desc: false }];

const USER_TABLE_COLUMNS: ColumnDefinition<DinaUserWithAgent>[] = [
  {
    cell: ({
      row: {
        original: { id, username }
      }
    }) => (
      <Link href={`/dina-user/view?id=${id}`} legacyBehavior>
        {username}
      </Link>
    ),
    accessorKey: "username"
  },
  {
    cell: ({
      row: {
        original: { agent }
      }
    }) =>
      agent?.id ? (
        <Link href={`/person/view?id=${agent.id}`} legacyBehavior>
          {agent.displayName}
        </Link>
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
        rolesPerGroup={rolesPerGroup ?? {}}
        hideTitle={true}
        hideTable={!rolesPerGroup || Object.keys(rolesPerGroup).length === 0}
      />
    ),
    accessorKey: "rolesPerGroup",
    enableSorting: false
  }
];

const USER_TABLE_QUERY_PROPS = {
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
};

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
        <ListPageLayout<DinaUserWithAgent>
          id="user-list"
          queryTableProps={USER_TABLE_QUERY_PROPS}
          defaultSort={DEFAULT_SORT}
        />
      </main>
      <Footer />
    </div>
  );
}

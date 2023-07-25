import {
  ButtonBar,
  ColumnDefinition8,
  CreateButton,
  ListPageLayout,
  dateCell
} from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Person } from "../../types/objectstore-api";

const AGENT_FILTER_ATTRIBUTES = ["displayName", "email", "createdBy"];
const AGENT_TABLE_COLUMNS: ColumnDefinition8<Person>[] = [
  {
    cell: ({
      row: {
        original: { id, displayName }
      }
    }) => (
      <Link href={`/person/view?id=${id}`}>
        <a>{displayName}</a>
      </Link>
    ),
    accessorKey: "displayName"
  },
  "email",
  "givenNames",
  "familyNames",
  {
    cell: ({
      row: {
        original: { aliases }
      }
    }) => <>{aliases?.join(", ")}</>,
    accessorKey: "aliases"
  },
  "createdBy",
  dateCell("createdOn")
];

export default function AgentListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("personListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="personListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/person" />
        </ButtonBar>
        <ListPageLayout
          filterAttributes={AGENT_FILTER_ATTRIBUTES}
          id="person-list"
          queryTableProps={{
            columns: AGENT_TABLE_COLUMNS,
            path: "agent-api/person",
            defaultSort: [
              {
                id: "familyNames",
                desc: false
              },
              {
                id: "givenNames",
                desc: false
              }
            ]
          }}
        />
      </main>
      <Footer />
    </div>
  );
}

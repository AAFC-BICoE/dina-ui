import { ButtonBar, CreateButton, ListPageLayout, dateCell } from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../components";
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
  "givenNames",
  "familyNames",
  {
    Cell: ({ original: { aliases } }) => <>{aliases?.join(", ")}</>,
    accessor: "aliases"
  },
  "createdBy",
  dateCell("createdOn")
];

export default function AgentListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head
        title={formatMessage("personListTitle")}
        lang={formatMessage("languageOfPage")}
        creator={formatMessage("agricultureCanada")}
        subject={formatMessage("subjectTermsForPage")}
      />
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
            path: "agent-api/person"
          }}
        />
      </main>
      <Footer />
    </div>
  );
}

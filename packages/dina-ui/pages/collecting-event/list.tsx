import { ButtonBar, CreateButton, ListPageLayout, dateCell } from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

const COLLECTING_EVENT_FILTER_ATTRIBUTES = ["createdBy"];
const COLLECTING_EVENT_TABLE_COLUMNS = [
  {
    Cell: ({ original: { id, createdBy } }) => (
      <Link href={`/collecting-event/view?id=${id}`}>{createdBy}</Link>
    ),
    accessor: "createdBy",
    sortable: false
  },
  dateCell("startEventDateTime"),
  dateCell("endEventDateTime"),
  "verbatimEventDateTime",
  dateCell("createdOn")
];

export default function CollectingEventListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("collectingEventListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1>
          <DinaMessage id="collectingEventListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collecting-event" />
        </ButtonBar>
        <ListPageLayout
          filterAttributes={COLLECTING_EVENT_FILTER_ATTRIBUTES}
          id="collecting-event-list"
          queryTableProps={{
            columns: COLLECTING_EVENT_TABLE_COLUMNS,
            path: "collection-api/collecting-event"
          }}
        />
      </main>
      <Footer />
    </div>
  );
}

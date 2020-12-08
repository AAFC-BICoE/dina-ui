import { ButtonBar, CreateButton, dateCell, ListPageLayout } from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

const COLLECTING_EVENT_TABLE_COLUMNS = [
  {
    Cell: ({ original: { id } }) => (
      <Link href={`/collections/collection-event/view?id=${id}`}>
        <a>{id}</a>
      </Link>
    ),
    accessor: "id"
  },
  dateCell("eventDateTime")
];

const COLLECTION_EVENT_FILTER_ATTRIBUTES = [];

export default function CollectionEventListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("collectingEventListTitle")} />
      <Nav />
      <div className="container-fluid">
        <h1>
          <DinaMessage id="collectingEventListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collections/collecting-event" />
        </ButtonBar>
        <ListPageLayout
          // filterAttributes={COLLECTION_EVENT_FILTER_ATTRIBUTES}
          id="collecting-event-list"
          queryTableProps={{
            columns: COLLECTING_EVENT_TABLE_COLUMNS,
            path: "collections-api/collecting-event"
          }}
        />
      </div>
      <Footer />
    </div>
  );
}

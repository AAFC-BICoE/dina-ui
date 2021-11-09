import { ButtonBar, CreateButton, ListPageLayout, dateCell } from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

const COLLECTOR_GROUP_FILTER_ATTRIBUTES = ["createdBy"];
const COLLECTOR_GROUP_TABLE_COLUMNS = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/collection/collector-group/view?id=${id}`}>{name}</Link>
    ),
    accessor: "name",
    sortable: false
  },
  "createdBy",
  dateCell("createdOn")
];

export default function collectorGroupListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("collectorGroupListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="collectorGroupListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/collector-group" />
        </ButtonBar>
        <ListPageLayout
          filterAttributes={COLLECTOR_GROUP_FILTER_ATTRIBUTES}
          id="collector-group-list"
          queryTableProps={{
            columns: COLLECTOR_GROUP_TABLE_COLUMNS,
            path: "collection-api/collector-group"
          }}
        />
      </main>
      <Footer />
    </div>
  );
}

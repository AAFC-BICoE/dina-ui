import { ButtonBar, CreateButton, ListPageLayout, dateCell } from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

const PREPARATION_TYPE_FILTER_ATTRIBUTES = ["createdBy"];
const PREPARATION_TYPE_TABLE_COLUMNS = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/collection/preparation-type/view?id=${id}`}>{name}</Link>
    ),
    accessor: "name",
    sortable: false
  },
  "createdBy",
  dateCell("createdOn")
];

export default function preparationTypeListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("preparationTypeListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1>
          <DinaMessage id="preparationTypeListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/preparation-type" />
        </ButtonBar>
        <ListPageLayout
          filterAttributes={PREPARATION_TYPE_FILTER_ATTRIBUTES}
          id="preparation-type-list"
          queryTableProps={{
            columns: PREPARATION_TYPE_TABLE_COLUMNS,
            path: "collection-api/preparation-type"
          }}
        />
      </main>
      <Footer />
    </div>
  );
}

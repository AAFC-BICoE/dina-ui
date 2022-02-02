import {
  ButtonBar,
  CreateButton,
  FilterAttribute,
  ListPageLayout,
  stringArrayCell
} from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

const FILTER_ATTRIBUTES: FilterAttribute[] = ["name"];
const TABLE_COLUMNS = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/collection/managed-attributes-view/view?id=${id}`}>
        {name}
      </Link>
    ),
    accessor: "name"
  },
  stringArrayCell("attributeUuids")
];

export default function ManagedAttributesViewListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("managedAttributesViews")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="managedAttributesViews" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/managed-attributes-view" />
        </ButtonBar>
        <ListPageLayout
          filterAttributes={FILTER_ATTRIBUTES}
          id="managed-attributes-view-list"
          queryTableProps={{
            columns: TABLE_COLUMNS,
            path: "collection-api/managed-attributes-view",
            defaultSort: [
              {
                id: "name",
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

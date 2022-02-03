import {
  ButtonBar,
  CreateButton,
  dateCell,
  FilterAttribute,
  ListPageLayout,
  stringArrayCell
} from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { CustomView } from "../../../types/collection-api";

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
  stringArrayCell("viewConfiguration.attributeKeys"),
  "createdBy",
  dateCell("createdOn")
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
        <ListPageLayout<CustomView>
          filterAttributes={FILTER_ATTRIBUTES}
          id="managed-attributes-view-list"
          queryTableProps={{
            columns: TABLE_COLUMNS,
            path: "collection-api/custom-view",
            defaultSort: [
              {
                id: "name",
                desc: false
              }
            ],
            filter: { "viewConfiguration.type": "managed-attributes-view" }
          }}
        />
      </main>
      <Footer />
    </div>
  );
}

import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  dateCell,
  FilterAttribute,
  ListPageLayout,
  useBulkGet
} from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  CustomView,
  managedAttributesViewSchema
} from "../../../types/collection-api";
import { ManagedAttribute } from "../../../types/objectstore-api";

const FILTER_ATTRIBUTES: FilterAttribute[] = ["name"];

/** Renders the list of managed attribute names on a CustomView. */
function ManagedAttributeNames({ customView }: { customView: CustomView }) {
  const viewConfig = customView.viewConfiguration;

  const keys =
    (managedAttributesViewSchema.isValidSync(viewConfig) &&
      viewConfig.attributeKeys) ||
    [];

  const ids =
    (managedAttributesViewSchema.isValidSync(viewConfig) &&
      keys.map(key => `${viewConfig.managedAttributeComponent}.${key}`)) ||
    [];

  const { data } = useBulkGet<ManagedAttribute>({
    ids,
    listPath: `collection-api/managed-attribute`
  });

  // Render either the names or keys, whichever is available:
  return (
    <>
      {(data?.map?.((ma: any) => ma.name || ma.key || ma.id) || keys).join(
        ", "
      )}
    </>
  );
}

export default function ManagedAttributesViewListPage() {
  const { formatMessage } = useDinaIntl();

  const TABLE_COLUMNS: ColumnDefinition<CustomView>[] = [
    {
      Cell: ({ original: { id, name } }) => (
        <Link href={`/collection/managed-attributes-view/view?id=${id}`}>
          <a className="managed-attributes-view-link">{name}</a>
        </Link>
      ),
      accessor: "name"
    },
    {
      Cell: ({ original: customView }) => {
        return <ManagedAttributeNames customView={customView} />;
      },
      accessor: "viewConfiguration.attributeKeys",
      Header: formatMessage("managedAttributes")
    },
    "createdBy",
    dateCell("createdOn")
  ];

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
            filter: { "viewConfiguration.type": "managed-attributes-view" }
          }}
        />
      </main>
      <Footer />
    </div>
  );
}

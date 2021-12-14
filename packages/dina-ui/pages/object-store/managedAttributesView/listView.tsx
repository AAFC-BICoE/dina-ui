import {
  ButtonBar,
  ColumnDefinition,
  CommonMessage,
  descriptionCell,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../../components";
import { DINAUI_MESSAGES_ENGLISH } from "../../../intl/dina-ui-en";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  ManagedAttribute,
  MANAGED_ATTRIBUTE_TYPE_OPTIONS
} from "../../../types/objectstore-api/resources/ManagedAttribute";

const ATTRIBUTES_LIST_COLUMNS: ColumnDefinition<ManagedAttribute>[] = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/object-store/managedAttributesView/detailsView?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    Header: "Name",
    accessor: "name"
  },
  "createdBy",
  descriptionCell("multilingualDescription"),
  {
    Cell: ({ original: { acceptedValues, managedAttributeType } }) => {
      const labelKey: keyof typeof DINAUI_MESSAGES_ENGLISH | undefined =
        acceptedValues?.length
          ? "field_managedAttributeType_picklist_label"
          : MANAGED_ATTRIBUTE_TYPE_OPTIONS.find(
              option => option.value === managedAttributeType
            )?.labelKey;

      return <div>{labelKey && <DinaMessage id={labelKey} />}</div>;
    },
    accessor: "managedAttributeType",
    // The API sorts alphabetically by key, not displayed intl-ized value,
    // so the displayed order wouldn't make sense.
    sortable: false
  },
  {
    Cell: ({ original: { acceptedValues } }) => (
      <div>{acceptedValues?.map(val => `"${val}"`)?.join(", ")}</div>
    ),
    accessor: "acceptedValues"
  }
];

const ATTRIBUTES_FILTER_ATTRIBUTES = ["name"];

export default function ManagedAttributesListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("managedAttributeListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="managedAttributeListTitle" />
        </h1>
        <ButtonBar>
          <Link href="/object-store/managedAttributesView/detailsView">
            <a className="btn btn-primary">
              <CommonMessage id="createNew" />
            </a>
          </Link>
        </ButtonBar>
        <ListPageLayout
          filterAttributes={ATTRIBUTES_FILTER_ATTRIBUTES}
          id="managed-attribute-list"
          queryTableProps={{
            columns: ATTRIBUTES_LIST_COLUMNS,
            path: "objectstore-api/managed-attribute"
          }}
        />
      </main>
      <Footer />
    </div>
  );
}

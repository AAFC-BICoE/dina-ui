import {
  ColumnDefinition,
  ListPageLayout,
  ButtonBar,
  CreateButton
} from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import {
  ManagedAttribute,
  MANAGED_ATTRIBUTE_TYPE_OPTIONS
} from "../../../types/objectstore-api/resources/ManagedAttribute";
import { CommonMessage } from "common-ui/lib/intl/common-ui-intl";
import { DINAUI_MESSAGES_ENGLISH } from "../../../intl/dina-ui-en";

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
  {
    Cell: ({ original: { description } }) =>
      description?.en && description?.fr ? (
        <>
          en : {description?.en} | fr : {description?.fr}
        </>
      ) : description?.en ? (
        description.en
      ) : (
        description.fr
      ),
    accessor: "description"
  },
  {
    Cell: ({ original: { acceptedValues, managedAttributeType } }) => {
      const labelKey:
        | keyof typeof DINAUI_MESSAGES_ENGLISH
        | undefined = acceptedValues?.length
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
  return (
    <div>
      <Head title="Managed Attributes" />
      <Nav />
      <main className="container-fluid">
        <h1>
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

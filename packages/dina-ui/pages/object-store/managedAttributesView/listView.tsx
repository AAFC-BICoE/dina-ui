import { ColumnDefinition, ListPageLayout } from "common-ui";
import Link from "next/link";
import { Head, Nav } from "../../../components";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { ManagedAttribute } from "../../../types/objectstore-api/resources/ManagedAttribute";

const ATTRIBUTES_LIST_COLUMNS: Array<ColumnDefinition<ManagedAttribute>> = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/object-store/managedAttributesView/detailsView?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    Header: "Name",
    accessor: "name"
  },
  "createdDate",
  {
    Cell: ({ original: { description } }) =>
      (description.en || description.fr) && (
        <div>
          en : {description.en} | fr : {description.fr}
        </div>
      ),

    accessor: "description"
  },
  "managedAttributeType",
  {
    Cell: ({ original: { acceptedValues } }) => (
      <div>{acceptedValues?.join(", ")}</div>
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
      <div className="container-fluid">
        <h1>
          <DinaMessage id="managedAttributeListTitle" />
        </h1>
        <Link href="/object-store/managedAttributesView/detailsView">
          <a className="btn btn-primary">
            <DinaMessage id="addManagedAttributeButtonText" />
          </a>
        </Link>
        <ListPageLayout
          filterAttributes={ATTRIBUTES_FILTER_ATTRIBUTES}
          id="managed-attribute-list"
          queryTableProps={{
            columns: ATTRIBUTES_LIST_COLUMNS,
            path: "objectstore-api/managed-attribute"
          }}
        />
      </div>
    </div>
  );
}
